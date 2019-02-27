'use strict'

const ServerMock = require('mock-http-server')

const config = require('./config')

const server = new ServerMock({ host: 'localhost', port: config.mockServerPort })

server.on({
  method: 'get',
  path: '/userinfo',
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sub: config.userId })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/revoke',
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' }
  }
})

server.on({
  method: 'post',
  path: '/oauth2/token',
  filter: function (req) {
    return !req.headers.authorization
  },
  reply: {
    status: 401,
    headers: { 'content-type': 'application/json' }
  }
})

server.on({
  method: 'post',
  path: '/oauth2/token',
  filter: function (req) {
    return !!req.headers.authorization && req.body.grant_type === 'authorization_code'
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      access_token: config.accessToken,
      expires_in: config.expiresIn,
      id_token: config.idToken,
      refresh_token: config.refreshToken,
      scope: config.scope.join(' '),
      token_type: config.tokenType
    })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/token',
  filter: function (req) {
    return !!req.headers.authorization && req.body.grant_type === 'refresh_token'
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      access_token: config.refreshedAccessToken,
      expires_in: config.expiresIn,
      id_token: config.idToken,
      refresh_token: config.refreshedRefreshToken,
      scope: config.scope.join(' '),
      token_type: config.tokenType
    })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/introspect',
  filter: function (req) {
    return !!req.headers.authorization && req.body.token === config.expiredAccessToken
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'active': false
    })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/introspect',
  filter: function (req) {
    return !!req.headers.authorization && req.body.token === config.refreshToken
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'active': true,
      'scope': config.scope.join(' '),
      'client_id': config.clientId,
      'sub': config.userId,
      'exp': config.exp,
      'iat': 1551187917,
      'iss': 'http://192.168.99.100:4444/',
      'token_type': 'refresh_token'
    })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/introspect',
  filter: function (req) {
    return !!req.headers.authorization && req.body.token === config.accessToken
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'active': true,
      'scope': config.scope.join(' '),
      'client_id': config.clientId,
      'sub': config.userId,
      'exp': config.exp,
      'iat': 1551187917,
      'iss': 'http://192.168.99.100:4444/',
      'token_type': 'access_token'
    })
  }
})

module.exports = server
