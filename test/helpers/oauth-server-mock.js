'use strict'

const ServerMock = require('mock-http-server')

const fakes = require('./fakes')

const server = new ServerMock({ host: 'localhost', port: fakes.mockServerPort })

server.on({
  method: 'get',
  path: '/oauth2/userinfo',
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sub: fakes.userId })
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
      access_token: fakes.accessToken,
      expires_in: fakes.expiresIn,
      id_token: fakes.idToken,
      refresh_token: fakes.refreshToken,
      scope: fakes.scope.join(' '),
      token_type: fakes.tokenType
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
      access_token: fakes.refreshedAccessToken,
      expires_in: fakes.expiresIn,
      id_token: fakes.idToken,
      refresh_token: fakes.refreshedRefreshToken,
      scope: fakes.scope.join(' '),
      token_type: fakes.tokenType
    })
  }
})

server.on({
  method: 'post',
  path: '/oauth2/introspect',
  filter: function (req) {
    return !!req.headers.authorization && req.body.token === fakes.expiredAccessToken
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
    return !!req.headers.authorization && req.body.token === fakes.refreshToken
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'active': true,
      'scope': fakes.scope.join(' '),
      'client_id': fakes.clientId,
      'sub': fakes.userId,
      'exp': fakes.exp,
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
    return !!req.headers.authorization && req.body.token === fakes.accessToken
  },
  reply: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'active': true,
      'scope': fakes.scope.join(' '),
      'client_id': fakes.clientId,
      'sub': fakes.userId,
      'exp': fakes.exp,
      'iat': 1551187917,
      'iss': 'http://192.168.99.100:4444/',
      'token_type': 'access_token'
    })
  }
})

module.exports = server
