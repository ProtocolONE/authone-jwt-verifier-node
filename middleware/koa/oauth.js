'use strict'

const format = require('string-template')

const kebabCase = str => str
  .replace(/([A-Z])([A-Z])/g, '$1-$2')
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase()

const getParams = (ctx) => {
  return {
    headers: {
      'X-Request-ID': ctx.id
    },
    logger: ctx.log
  }
}

module.exports.requestAuthenticator = (jwtVerifierInstance, namespace) => {
  if (!jwtVerifierInstance) {
    throw new Error('No jwtVerifier instance passed')
  }
  if (!namespace) {
    throw new Error(`No namespace passed`)
  }

  const getTokenFromHeader = (ctx) => {
    if (ctx.header && ctx.header.authorization) {
      const parts = ctx.header.authorization.split(' ')

      if (parts.length === 2) {
        const scheme = parts[0]
        const credentials = parts[1]

        if (/^Bearer$/i.test(scheme)) {
          return credentials
        }
      }
    }
  }

  return async function (ctx, next) {
    try {
      const token = getTokenFromHeader(ctx)
      if (!token) {
        ctx.throw(401, 'Authentication Error')
        return
      }

      const result = await jwtVerifierInstance.introspect(token, getParams(ctx))
      if (!result.active) {
        ctx.throw(401, 'Authentication Error')
        return
      }

      ctx.state = ctx.state || {}
      ctx.state[namespace] = result

      return next()
    } catch (err) {
      throw err
    }
  }
}

module.exports.oauthEndpoints = (jwtVerifierInstance, options) => {
  if (!jwtVerifierInstance) {
    throw new Error('No jwtVerifier instance passed')
  }

  if (!options) {
    throw new Error('No options passed')
  }

  const requiredOptions = ['namespace', 'postMessageHtmlTemplate', 'postMessageTargetOrigin']
  requiredOptions.forEach(key => {
    if (typeof (options[key]) === 'undefined') {
      throw new Error(`Required option "${key}" not set`)
    }
  })

  const handleError = (ctx, err, sendHtmlResponse) => {
    err.code = kebabCase(err.code || err.message)
    if (sendHtmlResponse) {
      ctx.log.error(err)
      setHtmlResponse(ctx, { errorCode: err.code })
    } else {
      ctx.throw(err.status || 500, err.message)
    }
  }

  const getTokensFromSession = (ctx) => {
    const tokens = ctx.session[options.namespace]
    if (!tokens) {
      throw new Error('User not logged')
    }
    return tokens
  }

  const isUserLogged = (ctx) => {
    return !!ctx.session[options.namespace]
  }

  const setHtmlResponse = (ctx, params) => {
    const defaultParams = {
      accessToken: '',
      expiresIn: 0,
      targetOrigin: options.postMessageTargetOrigin
    }
    const resultParams = Object.assign({}, defaultParams, params)
    if (resultParams.accessToken) {
      resultParams.errorCode = ''
    } else {
      resultParams.errorCode = typeof (resultParams.errorCode) === 'undefined' ? '' : resultParams.errorCode
    }
    resultParams.isSuccess = resultParams.errorCode === ''
    ctx.type = 'html'
    ctx.body = format(options.postMessageHtmlTemplate, resultParams)
  }

  // Login endpoint
  const login = async (ctx) => {
    try {
      if (isUserLogged(ctx)) {
        throw new Error('User already logged')
      }
      ctx.session.state = Math.random().toString(36).substring(2)
      const url = jwtVerifierInstance.createAuthUrl(ctx.session.state)
      ctx.redirect(url)
    } catch (err) {
      handleError(ctx, err, true)
    }
  }

  // Authorized endpoint
  const authorize = async (ctx) => {
    try {
      if (isUserLogged(ctx)) {
        throw new Error('User already logged')
      }
      const code = ctx.query.code
      const state = ctx.query.state
      if (!code || !state || state !== ctx.session.state) {
        throw new Error('Invalid code or state')
      }
      // Request access token
      const tokens = await jwtVerifierInstance.exchange(code, getParams(ctx))

      // flushing state
      ctx.session.state = null
      ctx.session[options.namespace] = tokens

      return setHtmlResponse(ctx, {
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in
      })
    } catch (err) {
      handleError(ctx, err, true)
    }
  }

  const userinfo = async (ctx) => {
    try {
      const tokens = getTokensFromSession(ctx)
      return jwtVerifierInstance.getUserInfo(tokens.access_token, getParams(ctx))
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const refresh = async (ctx) => {
    try {
      const tokens = getTokensFromSession(ctx)
      const newTokens = await jwtVerifierInstance.refresh(tokens.refresh_token, getParams(ctx))
      ctx.session[options.namespace] = newTokens
      ctx.body = {
        access_token: newTokens.access_token,
        expires_in: newTokens.expires_in
      }
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const introspect = async (ctx) => {
    try {
      const tokens = getTokensFromSession(ctx)
      return jwtVerifierInstance.introspect(tokens.access_token, getParams(ctx))
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const logout = async (ctx) => {
    try {
      // Revoke tokens
      const tokens = getTokensFromSession(ctx)
      await jwtVerifierInstance.revokeAll(tokens.access_token, tokens.refresh_token, getParams(ctx))
      ctx.session[options.namespace] = undefined
      ctx.status = 204
    } catch (err) {
      handleError(ctx, err)
    }
  }

  return {
    login,
    authorize,
    refresh,
    introspect,
    logout,
    userinfo,
    setHtmlResponse
  }
}
