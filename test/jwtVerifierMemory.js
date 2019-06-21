'use strict'

const test = require('ava')

const { JwtVerifier } = require('../')

const fakes = require('../mock/fakes')
const server = require('../mock/oauth-server-mock')

const verifierOptions = {
  issuer: fakes.issuer,
  clientId: fakes.clientId,
  clientSecret: fakes.clientSecret,
  redirectUrl: fakes.redirectUrl,
  scopes: fakes.scope
}

const jwtVerifier = new JwtVerifier(verifierOptions)

const requestParams = fakes.requestParams

test.before(t => {
  server.start(() => t.pass())
})

test('should return correct authorization header token for basic auth', t => {
  const expectedResult = fakes.basicAuthHeader
  t.is(jwtVerifier.getAuthorizationHeaderToken(), expectedResult)
})

test('should returns correct authorize url', t => {
  const expectedResult = fakes.issuer + '/oauth2/auth?response_type=code' +
    `&client_id=${fakes.clientId}&scope=${encodeURIComponent(fakes.scope.join(' '))}` +
    `&redirect_uri=${encodeURIComponent(fakes.redirectUrl)}&state=${fakes.state}`
  t.is(jwtVerifier.createAuthUrl(fakes.state), expectedResult)
})

test('should returns correct authorize url with no state passed', t => {
  const expectedResult = fakes.issuer + '/oauth2/auth?response_type=code' +
    `&client_id=${fakes.clientId}&scope=${encodeURIComponent(fakes.scope.join(' '))}` +
    `&redirect_uri=${encodeURIComponent(fakes.redirectUrl)}&state=`
  t.is(jwtVerifier.createAuthUrl(), expectedResult)
})

test('should exchange code to token', async t => {
  const expectedResult = {
    access_token: fakes.accessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.exchange(fakes.code, params), expectedResult)
})

test('should exchange code to token without params', async t => {
  const expectedResult = {
    access_token: fakes.accessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(await jwtVerifier.exchange(fakes.code), expectedResult)
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
    access_token: fakes.refreshedAccessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshedRefreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.refresh(fakes.refreshToken, params), expectedResult)
})

test('should refresh token without params', async t => {
  const expectedResult = {
    access_token: fakes.refreshedAccessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshedRefreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(await jwtVerifier.refresh(fakes.refreshToken), expectedResult)
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
    sub: fakes.userId
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.getUserInfo(fakes.accessToken, params), expectedResult)
})

test('should get userinfo by token without params', async t => {
  const expectedResult = {
    sub: fakes.userId
  }
  t.deepEqual(await jwtVerifier.getUserInfo(fakes.accessToken), expectedResult)
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
    'scope': fakes.scope.join(' '),
    'client_id': fakes.clientId,
    'sub': fakes.userId,
    'exp': fakes.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token'
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(fakes.accessToken, params), expectedResult)
})

test('should introspect token without params', async t => {
  const expectedResult = {
    'active': true,
    'scope': fakes.scope.join(' '),
    'client_id': fakes.clientId,
    'sub': fakes.userId,
    'exp': fakes.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'access_token'
  }
  t.deepEqual(await jwtVerifier.introspect(fakes.accessToken), expectedResult)
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
    'scope': fakes.scope.join(' '),
    'client_id': fakes.clientId,
    'sub': fakes.userId,
    'exp': fakes.exp,
    'iat': 1551187917,
    'iss': 'http://192.168.99.100:4444/',
    'token_type': 'refresh_token'
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(fakes.refreshToken, params), expectedResult)
})

test('should introspect expired token', async t => {
  const expectedResult = {
    'active': false
  }
  const params = Object.assign({}, requestParams)
  t.deepEqual(await jwtVerifier.introspect(fakes.expiredAccessToken, params), expectedResult)
})

test('should revoke token', async t => {
  const params = Object.assign({}, requestParams)
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revoke(fakes.accessToken, params)
  })
  t.is(result, undefined)
})

test('should revoke token without params', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revoke(fakes.accessToken)
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
    return jwtVerifier.revokeAll(fakes.accessToken, fakes.refreshToken, params)
  })
  t.is(result, undefined)
})

test('should revoke all tokens at once without params', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll(fakes.accessToken, fakes.refreshToken)
  })
  t.is(result, undefined)
})

test('should not throws error on revoke all tokens with only one token passed', async t => {
  const result = await t.notThrowsAsync(async () => {
    return jwtVerifier.revokeAll(fakes.accessToken)
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
