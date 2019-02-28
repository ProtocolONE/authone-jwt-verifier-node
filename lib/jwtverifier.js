'use strict'

const qs = require('querystring')
const axios = require('axios')

const StorageMemory = require('../storage/storage-memory')

const formUrlEncode = (value) => encodeURIComponent(value).replace(/%20/g, '+')

class JwtVerifier {
  constructor (options, storage) {
    if (!options) {
      throw new Error(`Options not passed`)
    }

    this.config = {}
    const requiredOptions = ['issuer', 'clientId', 'clientSecret', 'redirectUrl']
    requiredOptions.forEach(key => {
      const value = options[key]
      if (typeof (value) === 'undefined') {
        throw new Error(`Required option '${key}' not set`)
      }
      this.config[key] = value
    })
    this.config.scopes = options.scopes || []

    if (!this.config.issuer) {
      throw new Error(`Issuer option passed but cannot be empty`)
    }
    this.config.endpoint = {
      authUrl: this.config.issuer + '/oauth2/auth',
      tokenUrl: this.config.issuer + '/oauth2/token',
      userInfoUrl: this.config.issuer + '/userinfo',
      revokeUrl: this.config.issuer + '/oauth2/revoke',
      introspectUrl: this.config.issuer + '/oauth2/introspect',
      jwksUrl: this.config.issuer + '/.well-known/jwks.json'
    }

    this.httpClient = axios.create()
    this.storage = storage || new StorageMemory()
  }

  log (logger, level, ...args) {
    if (logger) {
      try {
        this.logger[level](...args)
      } catch (e) {

      }
    }
  }

  getAuthorizationHeaderToken () {
    const encodedCredentials = [formUrlEncode(this.config.clientId), formUrlEncode(this.config.clientSecret)]
    return Buffer.from(encodedCredentials.join(':')).toString('base64')
  }

  getTimeToExpire (exp) {
    exp = ((exp || 0) * 1) || 0
    if (!exp) {
      return 0
    }
    const now = Math.floor((new Date()).getTime() / 1000)
    return Math.ceil(exp - now)
  }

  async request (url, data, params) {
    params = params || {}
    const logger = params.logger
    const options = {
      url: url,
      method: (params.method || 'post').toLowerCase(),
      json: true,
      headers: params.headers || {}
    }

    options.headers.Authorization = `Basic ${this.getAuthorizationHeaderToken()}`

    if (options.method.toLowerCase() !== 'get' && data) {
      options.data = qs.stringify(data)
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    this.log(logger, 'debug', 'Sending request to: (%s) %s', options.method, options.url)
    this.log(logger, 'debug', 'With options: %j', options)

    try {
      const result = await this.httpClient(options)
      return result.data
    } catch (err) {
      throw err
    }
  }

  createAuthUrl (state) {
    const baseParams = {
      response_type: 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUrl,
      state: state || ''
    }
    return `${this.config.endpoint.authUrl}?${qs.stringify(baseParams)}`
  }

  async exchange (code, params) {
    if (!code) {
      throw new Error('Code not passed')
    }
    const data = {
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUrl,
      code: code
    }
    return this.request(this.config.endpoint.tokenUrl, data, params)
  }

  async refresh (token, params) {
    if (!token) {
      throw new Error('No token passed')
    }
    const data = {
      grant_type: 'refresh_token',
      refresh_token: token
    }
    return this.request(this.config.endpoint.tokenUrl, data, params)
  }

  async introspect (token, params) {
    if (!token) {
      throw new Error('No token passed')
    }
    const inCache = await this.storage.get(token)
    if (inCache) {
      return inCache
    }
    const data = {
      token: token
    }
    const result = await this.request(this.config.endpoint.introspectUrl, data, params)
    await this.storage.set(token, result, this.getTimeToExpire(result.exp))
    return result
  }

  async getUserInfo (token, params) {
    if (!token) {
      throw new Error('No token passed')
    }
    const data = {
      access_token: token
    }
    params = params || {}
    params.method = 'get'
    return this.request(`${this.config.endpoint.userInfoUrl}?${qs.stringify(data)}`, null, params)
  }

  async revokeAll (accessToken, refreshToken, params) {
    return Promise.all([
      this.revoke(accessToken, 'access_token', params),
      this.revoke(refreshToken, 'refresh_token', params)
    ])
  }

  async revoke (token, type, params) {
    if (!token) {
      return
    }
    const data = {
      token_type_hint: type,
      token: token
    }
    await Promise.all([
      this.request(this.config.endpoint.revokeUrl, data, params),
      this.storage.del(token)
    ])
  }
}

module.exports = JwtVerifier
