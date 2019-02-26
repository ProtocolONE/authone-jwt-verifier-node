'use strict'

const url = require('url')
const qs = require('querystring')
const axios = require('axios')

const getClient = (params) => {
  params = params || {}
  return axios.create(params)
}

const formURLEncode = (value) => encodeURIComponent(value).replace(/%20/g, '+')

const HEADER_ENCODING_FORMAT = 'base64'

const defaultConfig = {
  clientId: '',
  clientSecret: '',
  allowedClientIds: [],
  authorizePath: '/oauth2/authorize',
  tokenPath: '/oauth2/token',
  revokePath: '/oauth2/token',
  userinfoPath: '/userinfo',
  introspectPath: '/oauth2/introspect',
  redirectUri: '/auth1/callback',
  authorizationMethod: 'header',
  publicHost: '',
  privateHost: '',
  debug: false
}

class Auth1Client {
  constructor (options, cache) {
    options = options || {}
    cache = cache || null

    this.config = Object.assign({}, defaultConfig, options)
    if (!this.config.allowedClientIds.includes(this.config.clientId)) {
      this.config.allowedClientIds.push(this.config.clientId)
    }
    this.client = getClient(this.config.overrides)
    this.cache = cache
    this.oauthToken = null
  }

  log (logger, level, ...args) {
    if (logger) {
      try {
        this.logger[level](...args)
      } catch (e) {

      }
    }
    if (this.config.debug) {
      console[level](...args)
    }
  }

  getAuthorizationHeaderToken () {
    const encodedCredentials = [formURLEncode(this.config.clientId), formURLEncode(this.config.clientSecret)]
    return Buffer.from(encodedCredentials.join(':')).toString(HEADER_ENCODING_FORMAT)
  }

  async request (url, params) {
    let data = params.data
    const logger = params.logger || null
    const options = {
      url: url,
      method: params.method || 'POST',
      authorizationMethod: params.authorizationMethod || this.config.authorizationMethod,
      bodyFormat: params.bodyFormat || 'json',
      json: true,
      useAuth: typeof (params.useAuth) !== 'undefined' ? !!params.useAuth : true,
      headers: params.headers || {}
    }

    if (options.useAuth) {
      if (options.authorizationMethod === 'header') {
        const basicHeader = this.getAuthorizationHeaderToken()

        this.log(logger, 'debug', 'Using header authentication. Authorization header set to %s', basicHeader)

        options.headers.Authorization = `Basic ${basicHeader}`
      } else {
        this.log(logger, 'debug', 'Using body authentication')

        data = Object.assign({}, data, {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        })
      }
    } else {
      this.log(logger, 'debug', 'Skip authentication')
    }

    if (options.method !== 'GET') {
      if (options.bodyFormat === 'form') {
        this.log(logger, 'debug', 'Using form request format')

        // An example using `form` authorization params in the body is the GitHub API.
        options.data = qs.stringify(data)
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      } else {
        this.log(logger, 'debug', 'Using json request format')

        // An example using `json` authorization params in the body is the
        // Amazon Developer Publishing API.
        options.data = data
        options.headers['Content-Type'] = 'application/json'
      }
    } else {
      this.log(logger, 'debug', 'Bypass body due to GET request')
    }

    this.log(logger, 'debug', 'Creating request to: (%s) %s', options.method, options.url)
    this.log(logger, 'debug', 'Using options: %j', options)

    try {
      const result = await this.client(options)
      return result.data
    } catch (err) {
      throw err
    }
  }

  getOauth2Tokens () {
    return this.oauthToken
  }

  setOauth2Tokens (tokenData) {
    this.oauthToken = tokenData
  }

  getAuthorizeUrl (params) {
    if (Array.isArray(params.scope)) {
      params.scope = params.scope.join(',')
    }

    const baseParams = {
      response_type: 'code',
      client_id: this.config.clientId,
      scope: params.scope || '',
      redirect_uri: this.config.redirectUri,
      state: params.state || ''
    }

    const authorizeUrl = url.resolve(this.config.publicHost, this.config.authorizePath)

    return `${authorizeUrl}?${qs.stringify(baseParams)}`
  }

  async getToken (params) {
    const data = {
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirect_uri,
      code: params.code
    }

    const tokenUrl = url.resolve(this.config.publicHost, this.config.tokenPath)

    this.oauthToken = await this.request(tokenUrl, {
      logger: params.logger,
      headers: params.headers,
      data: data
    })

    return this.oauthToken
  }

  async refreshToken (params) {
    if (!(this.oauthToken && this.oauthToken.refresh_token)) {
      throw new Error('No token exists yet, please, pass the authentication first')
    }

    const data = {
      grant_type: 'refresh_token',
      refresh_token: this.oauthToken.refresh_token
    }

    const tokenUrl = url.resolve(this.config.publicHost, this.config.tokenPath)

    this.oauthToken = await this.request(tokenUrl, {
      logger: params.logger,
      headers: params.headers,
      data: data
    })

    return this.oauthToken
  }

  async introspect (params) {
    if (!(this.oauthToken && this.oauthToken.access_token)) {
      throw new Error('No token exists yet, please, pass the authentication first')
    }

    let result = {
      invalid: true,
      reason: 'initial'
    }

    let inCache = null
    if (this.cache) {
      inCache = await this.cache.get(this.oauthToken.access_token)
    }

    if (!inCache) {
      const data = {
        token: this.oauthToken.access_token
      }

      const introspectUrl = url.resolve(this.config.privateHost, this.config.introspectPath)

      result = await this.request(introspectUrl, {
        logger: params.logger,
        headers: params.headers,
        data: data,
        bodyFormat: 'form',
        useAuth: false
      })

      result.invalid = false
      result.reason = ''

      if (!result.active) {
        result.invalid = true
        result.reason = 'Token not active'
      } else {
        if (result.token_type !== 'access_token') {
          result.invalid = true
          result.reason = 'Token type invalid'
        }

        if (!this.config.allowedClientIds.includes(result.client_id)) {
          result.invalid = true
          result.reason = 'Client_id invalid'
        }
      }

      if (this.cache) {
        await this.cache.set(this.oauthToken.access_token, result)
      }

      if (result.invalid) {
        this.oauthToken = null
      }
    } else {
      result = inCache
    }
    return result
  }

  async userInfo (params) {
    if (!(this.oauthToken && this.oauthToken.access_token)) {
      throw new Error('No token exists yet, please, pass the authentication first')
    }

    const data = {
      access_token: this.oauthToken.access_token
    }

    const userinfoUrl = url.resolve(this.config.publicHost, this.config.userinfoPath)

    return this.request(`${userinfoUrl}?${qs.stringify(data)}`, {
      method: 'GET',
      headers: params.headers
    })
  }

  async revokeAll (params) {
    return Promise.all([
      this.revoke('access_token', params),
      this.revoke('refresh_token', params)
    ])
      .then(
        async () => {
          if (this.cache) {
            await this.cache.del(this.oauthToken.access_token)
          }
          this.oauthToken = null
          return null
        },
        (err) => {
          throw err
        }
      )
  }

  async revoke (type, params) {
    if (!(this.oauthToken && this.oauthToken[type])) {
      throw new Error('No token exists yet, please, pass the authentication first')
    }

    const data = {
      token_type_hint: type,
      token: this.oauthToken[type]
    }

    const revokeUrl = url.resolve(this.config.publicHost, this.config.revokePath)

    return this.request(revokeUrl, {
      logger: params.logger,
      headers: params.headers,
      data: data
    })
  }
}

module.exports = Auth1Client
