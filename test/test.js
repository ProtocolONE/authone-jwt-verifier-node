const test = require('ava')
const chai = require('chai')
const spies = require('chai-spies')

require('./helpers/oauth-server-mock')

const { auth1Oauth, auth1CacheLru, auth1CacheRedis, auth1KoaMiddleware } = require('../')
const config = require('./helpers/config')

chai.use(spies)
const expect = chai.expect

const oauthOptions = {
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

const getRequestId = () => Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

const auth1 = auth1Oauth(oauthOptions, auth1CacheLru())
const auth1Redis = auth1Oauth(oauthOptions, auth1CacheRedis())

const anotherOauthOptions = Object.assign({}, oauthOptions, { debug: false })
const auth1NoCache = auth1Oauth(anotherOauthOptions)

const middlewareOptions = {
  publicHost: config.publicHost,
  privateHost: config.privateHost,
  redirectUri: config.redirectUri,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  cacheType: 'lru',
  namespace: config.namespace,
  allowedClientIds: [config.clientId],
  postmessageHtmlTemplate: config.template,
  postMessageTargetOrigin: config.targetOrigin
}

const koaMiddleware = auth1KoaMiddleware(middlewareOptions)
const koaMiddlewareRedis = auth1KoaMiddleware(Object.assign({}, middlewareOptions, {
  cacheType: 'redis',
  cacheKeyPrefix: 'myprefix',
  cacheMaxAge: 1000,
  cacheRedisHost: 'localhost',
  cacheRedisPort: 6379
}))
const koaMiddlewareNoCache = auth1KoaMiddleware(Object.assign({}, middlewareOptions, { cacheType: '', debug: true }))

function getRedirect () {
  function redirect () {
    console.log('redirect called', arguments)
  }
  return chai.spy(redirect)
}

function getThrow () {
  return chai.spy(function () {
    console.log('throw called', arguments)
  })
}
function getNext () {
  function _next () {
    console.log('next called', arguments)
  }
  return chai.spy(_next)
}

const getFakeCtx = (session, query, header) => {
  return {
    id: getRequestId(),
    log: console,
    session: session || {},
    query: query || {},
    header: header || {},
    body: undefined,
    status: 200,
    redirect: getRedirect(),
    throw: getThrow()
  }
}

const fakeCtx = getFakeCtx()

test('should not fail when instance created without params', t => {
  const auth1NoOptionsAndCache = auth1Oauth()
  const expectedResult = null
  t.is(auth1NoOptionsAndCache.getOauth2Tokens(), expectedResult)
})

test('should return correct authorization header token for basic auth', t => {
  const expectedResult = 'NWM2ZmM0ODg4ZGI0YmMwMDAxYmVhY2VjOlJVT3VrNGJrV0ZObGp1Wnpxd3E1enJzMEdkQ0xZOVUzTUpxdWJ1RFZpVXY3WFF6Z2lVODR5Mjg4Smgwa2xLMVo='
  t.is(auth1.getAuthorizationHeaderToken(), expectedResult)
})

test('should return null instead oauth2 tokens while authentication is not passed and no token set', t => {
  const expectedResult = null
  t.is(auth1.getOauth2Tokens(), expectedResult)
})

test('should return error on refresh token while authentication is not passed and no token set', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.refreshToken(params) })
  t.is(error.message, expectedResult)
})

test('should also return error on userinfo while authentication is not passed and no token set', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.userInfo(params) })
  t.is(error.message, expectedResult)
})

test('should also return error on introspect while authentication is not passed and no token set', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = {
    sub: config.userId
  }

  t.deepEqual(await auth1.userInfo(params), expectedResult)
})

test('should introspect token', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
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

  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should introspect token twice (and get it from cache, if it exists)', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
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
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = null

  t.is(await auth1.revokeAll(params), expectedResult)
})

test('should return error on revoke token after revoke', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.revokeAll(params) })
  t.is(error.message, expectedResult)
})

test('should return error on refresh token after revoke', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = 'No token exists yet, please, pass the authentication first'

  const error = await t.throwsAsync(async () => { await auth1.refreshToken(params) })
  t.is(error.message, expectedResult)
})

test('should set token', t => {
  const token = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }

  t.is(auth1.setOauth2Tokens(token), undefined)
  t.deepEqual(auth1.getOauth2Tokens(), token)
})

test('should not set expired token', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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

  t.is(auth1.setOauth2Tokens(token, params), undefined)
  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should not set wrong configured token', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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

  t.is(auth1.setOauth2Tokens(token, params), undefined)
  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should not set token with another client id', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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

  t.is(auth1.setOauth2Tokens(token, params), undefined)
  t.deepEqual(await auth1.introspect(params), expectedResult)
})

test('should cover body authorizationMethod method for requests wrapper', async t => {
  const anotherOauthOptions = Object.assign({}, oauthOptions, { authorizationMethod: 'body' })

  const anotherAuth1 = auth1Oauth(anotherOauthOptions, auth1CacheLru())

  const params = {
    code: config.code
  }

  const expectedResult = 'Request failed with status code 401'

  const error = await t.throwsAsync(async () => { await anotherAuth1.getToken(params) })
  t.is(error.message, expectedResult)
})

test('should set token with Redis cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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

  t.is(auth1Redis.setOauth2Tokens(token, params), undefined)
  t.deepEqual(await auth1Redis.introspect(params), expectedResult)
})

test('should introspect token with Redis cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
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

  t.deepEqual(await auth1Redis.introspect(params), expectedResult)
})

test('should revoke tokens with Redis cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = null

  t.is(await auth1Redis.revokeAll(params), expectedResult)
})

test('should returns correct authorize url with no cache', t => {
  const params = {
    scope: config.scope.join(','),
    state: config.state
  }

  const expectedResult = config.publicHost + '/oauth2/authorize?response_type=code' +
    `&client_id=${config.clientId}&scope=${encodeURIComponent(config.scope.join(','))}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${config.state}`

  t.is(auth1NoCache.getAuthorizeUrl(params), expectedResult)
})

test('should returns correct authorize url with scope and state and no cache', t => {
  const params = {}

  const expectedResult = config.publicHost + '/oauth2/authorize?response_type=code' +
    `&client_id=${config.clientId}&scope=` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=`

  t.is(auth1NoCache.getAuthorizeUrl(params), expectedResult)
})

test('should set token with no cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

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

  t.is(auth1NoCache.setOauth2Tokens(token, params), undefined)
  t.deepEqual(await auth1NoCache.introspect(params), expectedResult)
})

test('should introspect token with no cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
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

  t.deepEqual(await auth1NoCache.introspect(params), expectedResult)
})

test('should revoke tokens with no cache', async t => {
  const params = {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }

  const expectedResult = null

  t.is(await auth1NoCache.revokeAll(params), expectedResult)
})

test('koa middleware should throws error when get userinfo for not logged user', async t => {
  const ctx = getFakeCtx()
  t.is(ctx.session[config.namespace], undefined)
  t.is(await koaMiddleware.userinfo(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when call refresh for not logged user', async t => {
  const ctx = getFakeCtx()
  t.is(ctx.session[config.namespace], undefined)
  t.is(await koaMiddleware.refresh(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when call introspect for not logged user', async t => {
  const ctx = getFakeCtx()
  t.is(ctx.session[config.namespace], undefined)
  t.is(await koaMiddleware.introspect(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when call logout for not logged user', async t => {
  const ctx = getFakeCtx()
  t.is(ctx.session[config.namespace], undefined)
  t.is(await koaMiddleware.logout(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should redirect on login', async t => {
  const expectedResult = undefined
  t.is(await koaMiddleware.login(fakeCtx), expectedResult)
  expect(fakeCtx.redirect).to.have.been.called()
  t.not(fakeCtx.session.state, null)
})

test('koa middleware should throws error while authorize in invalid state', async t => {
  const expectedResult = `var result = { error: "invalid-code-or-state", access_token: "", expires_in: 0, success: false }; var targetOrigin = "${config.targetOrigin}"`

  t.is(await koaMiddleware.authorize(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should authorize success', async t => {
  t.not(fakeCtx.session.state, null)

  fakeCtx.query.code = config.code
  fakeCtx.query.state = fakeCtx.session.state
  t.is(await koaMiddleware.authorize(fakeCtx), undefined)
  t.is(fakeCtx.session.state, null)

  const expectedResult = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(fakeCtx.session[config.namespace], expectedResult)
})

test('koa middleware should throws error while login with already logged user', async t => {
  t.not(fakeCtx.session[config.namespace], undefined)

  const expectedResult = `var result = { error: "user-already-logged", access_token: "", expires_in: 0, success: false }; var targetOrigin = "${config.targetOrigin}"`

  t.is(await koaMiddleware.authorize(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should throws error while authorize with already logged user', async t => {
  t.not(fakeCtx.session[config.namespace], undefined)

  const expectedResult = `var result = { error: "user-already-logged", access_token: "", expires_in: 0, success: false }; var targetOrigin = "${config.targetOrigin}"`

  t.is(await koaMiddleware.login(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should return userinfo success', async t => {
  const expectedResult = {
    sub: config.userId
  }
  t.deepEqual(await koaMiddleware.userinfo(fakeCtx), expectedResult)
})

test('koa middleware should return refresh success', async t => {
  const ininitalState = {
    access_token: config.accessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(fakeCtx.session[config.namespace], ininitalState)

  t.is(await koaMiddleware.refresh(fakeCtx), undefined)

  const expectedResult = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(fakeCtx.session[config.namespace], expectedResult)
})

test('koa middleware should return introspect success', async t => {
  const ininitalState = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(fakeCtx.session[config.namespace], ininitalState)

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

  t.deepEqual(await koaMiddleware.introspect(fakeCtx), expectedResult)
})

test('koa middleware should return logout success', async t => {
  const ininitalState = {
    access_token: config.refreshedAccessToken,
    expires_in: config.expiresIn,
    id_token: config.idToken,
    refresh_token: config.refreshedRefreshToken,
    scope: config.scope.join(' '),
    token_type: config.tokenType
  }
  t.deepEqual(fakeCtx.session[config.namespace], ininitalState)

  t.is(await koaMiddleware.logout(fakeCtx), undefined)

  t.is(fakeCtx.session[config.namespace], undefined)
})

test('koa middleware should return correct html response by default', t => {
  t.is(koaMiddleware.setHtmlResponse(fakeCtx, {}), undefined)

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, `var result = { error: "unknown", access_token: "", expires_in: 0, success: false }; var targetOrigin = "${config.targetOrigin}"`)
})

test('koa middleware should return correct html response with success', t => {
  const params = {
    accessToken: config.accessToken,
    expiresIn: config.expiresIn
  }
  t.is(koaMiddleware.setHtmlResponse(fakeCtx, params), undefined)

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, `var result = { error: "", access_token: "${config.accessToken}", expires_in: ${config.expiresIn}, success: true }; var targetOrigin = "${config.targetOrigin}"`)
})

test('koa middleware should return correct html response with error', t => {
  const errorCode = 'blah-blah-blah'
  const params = {
    errorCode: errorCode
  }
  t.is(koaMiddleware.setHtmlResponse(fakeCtx, params), undefined)

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, `var result = { error: "${errorCode}", access_token: "", expires_in: 0, success: false }; var targetOrigin = "${config.targetOrigin}"`)
})

test('koa middleware getTokenFromHeader should return null if no auth header', t => {
  t.is(koaMiddleware.getTokenFromHeader(fakeCtx), null)
})

test('koa middleware getTokenFromHeader should return null if auth header is invalid', t => {
  fakeCtx.header.authorization = 'sfdsfdsfdsf'
  t.is(koaMiddleware.getTokenFromHeader(fakeCtx), null)
})

test('koa middleware getTokenFromHeader should return null if auth header wave wrong format', t => {
  fakeCtx.header.authorization = 'Blah! ' + config.accessToken
  t.is(koaMiddleware.getTokenFromHeader(fakeCtx), null)
})

test('koa middleware getTokenFromHeader should return token from header', t => {
  fakeCtx.header.authorization = 'Bearer ' + config.accessToken
  t.is(koaMiddleware.getTokenFromHeader(fakeCtx), config.accessToken)
})

test('koa middleware authenticateRequest should throw ctx error if no auth header', async t => {
  const ctx = getFakeCtx()
  const next = getNext()
  t.is(await koaMiddleware.authenticateRequest(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware authenticateRequest should throw ctx error if auth token is expired', async t => {
  const ctx = getFakeCtx()
  ctx.header.authorization = `Bearer ${config.expiredAccessToken}`
  const next = getNext()
  t.is(await koaMiddleware.authenticateRequest(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware authenticateRequest should call next if auth token is ok', async t => {
  const ctx = getFakeCtx()
  ctx.header.authorization = `Bearer ${config.accessToken}`
  const next = getNext()
  t.is(await koaMiddleware.authenticateRequest(ctx, next), undefined)
  expect(ctx.throw).to.have.not.been.called()
  expect(next).to.have.been.called()
})

test('koa middleware with redis also should redirect on login', async t => {
  const expectedResult = undefined
  const ctx = getFakeCtx()
  t.is(await koaMiddlewareRedis.login(ctx), expectedResult)
  expect(fakeCtx.redirect).to.have.been.called()
})

test('koa middleware without cache should throw ctx error on authenticateRequest if auth token is expired', async t => {
  const ctx = getFakeCtx()
  ctx.header.authorization = `Bearer ${config.expiredAccessToken}`
  const next = getNext()
  t.is(await koaMiddlewareNoCache.authenticateRequest(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})
