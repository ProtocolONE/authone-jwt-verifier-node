const test = require('ava')

require('./helpers/oauth-server-mock')

const { auth1Oauth, auth1CacheLru, auth1CacheRedis } = require('../')
const config = require('./helpers/config')

const middlewareOptions = {
  publicHost: config.publicHost,
  privateHost: config.privateHost,
  authorizePath: config.authorizePath,
  tokenPath: config.tokenPath,
  revokePath: config.revokePath,
  userinfoPath: config.userinfoPath,
  introspectPath: config.introspectPath,
  redirectUri: config.redirectUri,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  debug: true
}

const auth1 = auth1Oauth(middlewareOptions, console, auth1CacheLru())
const auth1Redis = auth1Oauth(middlewareOptions, console, auth1CacheRedis({ host: config.redisHost }))

test('should return correct authorization header token for basic auth', t => {
  const expectedResult = 'NWM2ZmM0ODg4ZGI0YmMwMDAxYmVhY2VjOlJVT3VrNGJrV0ZObGp1Wnpxd3E1enJzMEdkQ0xZOVUzTUpxdWJ1RFZpVXY3WFF6Z2lVODR5Mjg4Smgwa2xLMVo='
  t.is(auth1.getAuthorizationHeaderToken(), expectedResult)
})

test('should return null instead oauth2 tokens while authentication is not passed and no token set', t => {
  const expectedResult = null
  t.is(auth1.getOauth2Tokens(), expectedResult)
})

test('should return error on refresh token while authentication is not passed and no token set', async t => {
  const params = {}

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.refreshToken(params) })
  t.is(error.message, expectedResult)
})

test('should also return error on userinfo while authentication is not passed and no token set', async t => {
  const params = {}

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.userInfo(params) })
  t.is(error.message, expectedResult)
})

test('should also return error on introspect while authentication is not passed and no token set', async t => {
  const params = {}

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.introspect(params) })
  t.is(error.message, expectedResult)
})

test('should returns correct authorize url', t => {
  const params = {
    scope: config.scope,
    state: config.state
  }

  const expectedResult = config.publicHost + '/oauth2/authorize?response_type=code' +
    `&client_id=${config.clientId}&scope=${encodeURIComponent(config.scope.join(','))}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${config.state}`

  t.is(auth1.getAuthorizeUrl(params), expectedResult)
})

test('should returns correct token', async t => {
  const params = {
    code: config.code
  }

  const expectedResult = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  t.deepEqual(await auth1.getToken(params), expectedResult)
})

test('should refresh token', async t => {
  const params = {}

  const expectedResult = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  t.deepEqual(await auth1.refreshToken(params), expectedResult)
})

test('should get userinfo by token', async t => {
  const params = {}

  const expectedResult = {
    sub: config.userId
  }

  t.deepEqual(await auth1.userInfo(params), expectedResult)
})

test('should introspect token', async t => {
  const params = {}

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': false,
    'reason': ''
  }

  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should introspect token twice (and get it from cache, if it exists)', async t => {
  const params = {}

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': false,
    'reason': ''
  }

  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should return oauth2 tokens', async t => {
  const expectedResult = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(auth1.getOauth2Tokens(), expectedResult)
})

test('should revoke tokens', async t => {
  const params = {}

  const expectedResult = null

  t.is(await auth1.revokeAll(params), expectedResult)
})

test('should return error on revoke token after revoke', async t => {
  const params = {}

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.revokeAll(params) })
  t.is(error.message, expectedResult)
})

test('should return error on refresh token after revoke', async t => {
  const params = {}

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.refreshToken(params) })
  t.is(error.message, expectedResult)
})

test('should set token', async t => {
  const params = {}

  const token = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': false,
    'reason': ''
  }

  t.deepEqual(await auth1.setOauth2Tokens(token, params), expectedResult)
})

test('should not set expired token', async t => {
  const params = {}

  const token = {
    access_token: config.expiredAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  const expectedResult = {
    'active': false,
    'invalid': true,
    'reason': 'Token not active'
  }

  t.deepEqual(await auth1.setOauth2Tokens(token, params), expectedResult)
})

test('should not set wrong configured token', async t => {
  const params = {}

  const token = {
    access_token: config.refreshToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'refresh_token',
    'invalid': true,
    'reason': 'Token type invalid'
  }

  t.deepEqual(await auth1.setOauth2Tokens(token, params), expectedResult)
})

test('should not set token with another client id', async t => {
  const params = {}

  const token = {
    access_token: config.invalidClientAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.wrongClientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': true,
    'reason': 'Client_id invalid'
  }

  t.deepEqual(await auth1.setOauth2Tokens(token, params), expectedResult)
})

test('should cover body authorizationMethod method for requests wrapper', async t => {
  const anotherMiddlewareOptions = Object.assign({}, middlewareOptions, { authorizationMethod: 'body' })

  const anotherAuth1 = auth1Oauth(anotherMiddlewareOptions, console, auth1CacheLru())

  const params = {
    code: config.code
  }

  const expectedResult = 'Request failed with status code 401'

  const error = await t.throwsAsync(async () => { await anotherAuth1.getToken(params) })
  t.is(error.message, expectedResult)
})

test('should set token with Redis cache', async t => {
  const params = {}

  const token = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': false,
    'reason': ''
  }

  t.deepEqual(await auth1Redis.setOauth2Tokens(token, params), expectedResult)
})

test('should introspect token with Redis cache', async t => {
  const params = {}

  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': 1551191517,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token',
    'invalid': false,
    'reason': ''
  }

  t.deepEqual(await auth1Redis.introspect(params), expectedResult)
})

test('should revoke tokens with Redis cache', async t => {
  const params = {}

  const expectedResult = null

  t.is(await auth1Redis.revokeAll(params), expectedResult)
})
