'use strict'

const _ = require('lodash')
const unless = require('koa-unless')
const format = require('string-template')

const Auth1Oauth = require('./auth1-oauth')
const Auth1CacheLru = require('./auth1-cache-lru')
const Auth1CacheRedis = require('./auth1-cache-redis')

module.exports = ({
  clientId = '',
  clientSecret = '',
  allowedClientIds = '',
  authorizePath = '',
  tokenPath = '',
  revokePath = '',
  userinfoPath = '',
  introspectPath = '',
  redirectUri = '',
  authorizationMethod = 'header',
  publicHost = '',
  privateHost = '',
  debug = false,
  cacheType = '',
  cacheMaxAge = 3600,
  cacheKeyPrefix = 'auth1OauthToken',
  cacheRedisHost = 'localhost',
  cacheRedisPort = 6379,
  namespace = 'auth1',
  postmessageHtmlTemplate = '',
  postMessageTargetOrigin = '*',
  scope = [],
  passthrough = false
}) => {
  let cacheInstance = null
  if (cacheType) {
    let CacheClass = null
    let cacheOptions = {}
    if (cacheMaxAge) {
      cacheOptions.maxAge = cacheMaxAge
    }
    if (cacheKeyPrefix) {
      cacheOptions.keyPrefix = cacheKeyPrefix
    }
    if (cacheType.toLowerCase() === 'lru') {
      CacheClass = Auth1CacheLru
    } else if (cacheType.toLowerCase() === 'redis') {
      CacheClass = Auth1CacheRedis
      if (cacheRedisHost) {
        cacheOptions.redisHort = cacheRedisHost
      }
      if (cacheRedisPort) {
        cacheOptions.redisPort = cacheRedisPort
      }
    }
    if (CacheClass) {
      cacheInstance = new CacheClass(cacheOptions)
    }
  }

  const oauthOptions = _.pickBy({
    clientId,
    clientSecret,
    allowedClientIds,
    authorizePath,
    tokenPath,
    revokePath,
    userinfoPath,
    introspectPath,
    redirectUri,
    authorizationMethod,
    publicHost,
    privateHost,
    debug
  }, _.identity)

  // Initialize Auth1-OAuth
  const auth1 = new Auth1Oauth(oauthOptions, cacheInstance)

  const throwError = (message) => {
    const err = new Error(message)
    err.code = _.kebabCase(message)
    throw err
  }

  const handleError = (ctx, err, sendResponse) => {
    ctx.log.error(err)
    if (sendResponse) {
      setHtmlResponse(ctx, { errorCode: err.code || err.message })
    } else {
      ctx.throw(err.status || 500, err.code || err.message, err)
    }
  }

  const getParams = (ctx, params) => {
    params = params || {}
    const commonParams = {
      headers: {
        'X-Request-ID': ctx.id
      },
      logger: ctx.log
    }
    return Object.assign({}, params, commonParams)
  }

  const getTokenFromSession = (ctx) => {
    if (!ctx.session[namespace]) {
      throwError('User not logged')
    }
    auth1.setOauth2Tokens(ctx.session[namespace])
  }

  const setHtmlResponse = (ctx, params) => {
    const defaultParams = {
      accessToken: '',
      expiresIn: 0,
      targetOrigin: postMessageTargetOrigin
    }
    const resultParams = Object.assign({}, defaultParams, params)

    if (resultParams.accessToken) {
      resultParams.errorCode = ''
    } else {
      resultParams.errorCode = typeof (resultParams.errorCode) === 'undefined' ? '' : resultParams.errorCode
    }

    resultParams.isSuccess = resultParams.errorCode === ''
    ctx.type = 'html'
    ctx.body = format(postmessageHtmlTemplate, resultParams)
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
    return null
  }

  // Login endpoint
  const login = async (ctx) => {
    try {
      if (ctx.session[namespace]) {
        throwError('User already logged')
      }
      ctx.session.state = Math.random().toString(36).substring(2)

      const url = auth1.getAuthorizeUrl(getParams(ctx, {
        scope: scope,
        state: ctx.session.state
      }))
      // Redirect to OAuth provider
      ctx.redirect(url)
    } catch (err) {
      handleError(ctx, err, true)
    }
  }

  // Authorized endpoint
  const authorize = async (ctx) => {
    try {
      if (ctx.session[namespace]) {
        throwError('User already logged')
      }
      const code = ctx.query.code
      const state = ctx.query.state
      if (!code || !state || state !== ctx.session.state) {
        throwError('Invalid code or state')
      }
      // Request access token
      ctx.session[namespace] = await auth1.getToken(getParams(ctx, {
        code: code
      }))

      // flushing state
      ctx.session.state = null
      return setHtmlResponse(ctx, {
        accessToken: ctx.session[namespace].access_token,
        expiresIn: ctx.session[namespace].expires_in
      })
    } catch (err) {
      handleError(ctx, err, true)
    }
  }

  const userinfo = async (ctx) => {
    try {
      getTokenFromSession(ctx)
      return auth1.userInfo(getParams(ctx))
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const refresh = async (ctx) => {
    try {
      getTokenFromSession(ctx)
      // Refresh access token
      ctx.session[namespace] = await auth1.refreshToken(getParams(ctx))
      ctx.status = 200
      ctx.body = {
        access_token: ctx.session[namespace].access_token,
        expires_in: ctx.session[namespace].expires_in
      }
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const introspect = async (ctx) => {
    try {
      getTokenFromSession(ctx)
      // Introspect access token
      return auth1.introspect(getParams(ctx))
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const logout = async (ctx) => {
    try {
      // Revoke tokens
      getTokenFromSession(ctx)
      await auth1.revokeAll(getParams(ctx))
      ctx.session[namespace] = undefined
      ctx.status = 204
    } catch (err) {
      handleError(ctx, err)
    }
  }

  const authenticateRequest = async function (ctx, next) {
    const token = getTokenFromHeader(ctx)
    if (!token && !passthrough) {
      ctx.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"')
      return
    }

    auth1.setOauth2Tokens({ access_token: token })
    const result = await auth1.introspect(getParams(ctx))
    if (result.invalid && !passthrough) {
      if (!debug) {
        ctx.log.error(result.reason)
      }
      ctx.throw(401, debug ? result.reason : 'Authentication Error')
      return
    }

    ctx.state = ctx.state || {}
    ctx.state[namespace] = result

    return next()
  }
  authenticateRequest.unless = unless

  return {
    login,
    authorize,
    refresh,
    introspect,
    logout,
    userinfo,
    authenticateRequest,
    getTokenFromHeader,
    setHtmlResponse
  }
}
