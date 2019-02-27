'use strict'

const test = require('ava')

const server = require('./helpers/oauth-server-mock')

const { JwtVerifier } = require('../')
const config = require('./helpers/config')

const verifierOptions = {
  issuer: config.issuer,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  redirectUrl: config.redirectUrl,
  scopes: config.scope
}

const jwtVerifier = new JwtVerifier(verifierOptions)

const requestParams = config.requestParams

test.before(t => {
  server.start(() => t.pass())
})

test('should return correct authorization header token for basic auth', t => {
  const expectedResult = config.basicAuthHeader
  t.is(jwtVerifier.getAuthorizationHeaderToken(), expectedResult)
})

test('should returns correct authorize url', t => {
  const expectedResult = config.issuer + '/oauth2/auth?response_type=code' +
    `&client_id=${config.clientId}&scope=${encodeURIComponent(config.scope.join(' '))}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUrl)}&state=${config.state}`
  t.is(jwtVerifier.createAuthUrl(config.state), expectedResult)
})

test('should returns correct authorize url with no state passed', t => {
  const expectedResult = config.issuer + '/oauth2/auth?response_type=code' +
    `&client_id=${config.clientId}&scope=${encodeURIComponent(config.scope.join(' '))}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUrl)}&state=`
  t.is(jwtVerifier.createAuthUrl(), expectedResult)
})

test('should exchange code to token', async t => {
  const expectedResult = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.exchange(config.code, params), expectedResult)
})

test('should exchange code to token without params', async t => {
  const expectedResult = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(await jwtVerifier.exchange(config.code), expectedResult)
})

test('should throws error on exchange without code', async t => {
  const expectedResult = 'Code not passed'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.exchange()
  })
  t.is(error.message, expectedResult)
})

test('should refresh token', async t => {
  const expectedResult = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.refresh(config.refreshToken, params), expectedResult)
})

test('should refresh token without params', async t => {
  const expectedResult = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(await jwtVerifier.refresh(config.refreshToken), expectedResult)
})

test('should throws error on refresh without token', async t => {
  const expectedResult = 'No token passed'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.refresh()
  })
  t.is(error.message, expectedResult)
})

test('should get userinfo by token', async t => {
  const expectedResult = {
    sub: config.userId
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.getUserInfo(config.accessToken, params), expectedResult)
})

test('should get userinfo by token without params', async t => {
  const expectedResult = {
    sub: config.userId
  }
  t.deepEqual(await jwtVerifier.getUserInfo(config.accessToken), expectedResult)
})

test('should throws error on get userinfo without token', async t => {
  const expectedResult = 'No token passed'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.getUserInfo()
  })
  t.is(error.message, expectedResult)
})

test('should introspect token', async t => {
  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': config.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token'
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(config.accessToken, params), expectedResult)
})

test('should introspect token without params', async t => {
  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': config.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token'
  }
  t.deepEqual(await jwtVerifier.introspect(config.accessToken), expectedResult)
})

test('should throws error on introspect without token', async t => {
  const expectedResult = 'No token passed'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.introspect()
  })
  t.is(error.message, expectedResult)
})

test('should introspect refresh token', async t => {
  const expectedResult = {
    'active': true,
    'scope': config.scope.join(' '),
    'client_id': config.clientId,
    'sub': config.userId,
    'exp': config.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'refresh_token'
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(config.refreshToken, params), expectedResult)
})

test('should introspect expired token', async t => {
  const expectedResult = {
    'active': false
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(config.expiredAccessToken, params), expectedResult)
})

test('should revoke token', async t => {
  const params = Object.assign({}, requestParams)
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revoke(config.accessToken, params)
  })
  t.is(result, undefined)
})

test('should revoke token without params', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revoke(config.accessToken)
  })
  t.is(result, undefined)
})

test('should not throws error on revoke without token', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revoke()
  })
  t.is(result, undefined)
})

test('should revoke all tokens at once', async t => {
  const params = Object.assign({}, requestParams)
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll(config.accessToken, config.refreshToken, params)
  })
  t.is(result, undefined)
})

test('should revoke all tokens at once without params', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll(config.accessToken, config.refreshToken)
  })
  t.is(result, undefined)
})

test('should not throws error on revoke all tokens with only one token passed', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll(config.accessToken)
  })
  t.is(result, undefined)
})

test('should not throws error on revoke all tokens without tokens passed', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll()
  })
  t.is(result, undefined)
})

test.after.always(t => {
  server.stop(() => t.pass())
})
