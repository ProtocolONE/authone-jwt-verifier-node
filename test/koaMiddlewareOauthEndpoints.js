'use strict'

const test = require('ava')
const chai = require('chai')

const { JwtVerifier, koaOauthMiddleware } = require('..')

const fakes = require('./helpers/fakes')
const server = require('./helpers/oauth-server-mock')

const expect = chai.expect

const verifierOptions = {
  issuer: fakes.issuer,
  clientId: fakes.clientId,
  clientSecret: fakes.clientSecret,
  redirectUrl: fakes.redirectUrl,
  scopes: fakes.scope
}

const jwtVerifier = new JwtVerifier(verifierOptions)

const endpointsOptions = {
  namespace: fakes.namespace,
  postMessageHtmlTemplate: fakes.template,
  postMessageTargetOrigin: fakes.targetOrigin
}

const oauthEndpoints = koaOauthMiddleware.oauthEndpoints(jwtVerifier, endpointsOptions)

const fakeCtx = fakes.getFakeCtx()

test.before(t => {
  server.start(() => t.pass())
})

test('should throws error when create oauthEndpoints without params', t => {
  const expectedResult = 'No jwtVerifier instance passed'
  const error = t.throws(() => { return koaOauthMiddleware.oauthEndpoints() })
  t.is(error.message, expectedResult)
})

test('should throws error when create oauthEndpoints without options', t => {
  const expectedResult = 'No options passed'
  const error = t.throws(() => { return koaOauthMiddleware.oauthEndpoints(jwtVerifier) })
  t.is(error.message, expectedResult)
})

test('should throws error when create oauthEndpoints without some required options 1', t => {
  const expectedResult = 'Required option "postMessageHtmlTemplate" not set'
  const options = {
    namespace: fakes.namespace
  }
  const error = t.throws(() => { return koaOauthMiddleware.oauthEndpoints(jwtVerifier, options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create oauthEndpoints without some required options 2', t => {
  const expectedResult = 'Required option "postMessageTargetOrigin" not set'
  const options = {
    namespace: fakes.namespace,
    postMessageHtmlTemplate: fakes.template
  }
  const error = t.throws(() => { return koaOauthMiddleware.oauthEndpoints(jwtVerifier, options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create oauthEndpoints without some required options 3', t => {
  const expectedResult = 'Required option "namespace" not set'
  const options = {
    postMessageHtmlTemplate: fakes.template,
    postMessageTargetOrigin: fakes.targetOrigin
  }
  const error = t.throws(() => { return koaOauthMiddleware.oauthEndpoints(jwtVerifier, options) })
  t.is(error.message, expectedResult)
})

test('should create oauthEndpoints instance success with all params passed', t => {
  const options = {
    namespace: fakes.namespace,
    postMessageHtmlTemplate: fakes.template,
    postMessageTargetOrigin: fakes.targetOrigin
  }
  t.notThrows(() => { return koaOauthMiddleware.oauthEndpoints(jwtVerifier, options) })
})

test('koa middleware should throws error when get userinfo for not logged user', async t => {
  const ctx = fakes.getFakeCtx()
  t.is(ctx.session[fakes.namespace], undefined)
  t.is(await oauthEndpoints.userinfo(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when try to introspect token for not logged user', async t => {
  const ctx = fakes.getFakeCtx()
  t.is(ctx.session[fakes.namespace], undefined)
  t.is(await oauthEndpoints.introspect(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when refresh token for not logged user', async t => {
  const ctx = fakes.getFakeCtx()
  t.is(ctx.session[fakes.namespace], undefined)
  t.is(await oauthEndpoints.refresh(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

test('koa middleware should throws error when logout token for not logged user', async t => {
  const ctx = fakes.getFakeCtx()
  t.is(ctx.session[fakes.namespace], undefined)
  t.is(await oauthEndpoints.logout(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
})

/* test('koa middleware should throws error when login for already logged user', async t => {
  const ctx = fakes.getFakeCtx()
  t.is(ctx.session[fakes.namespace], undefined)
  t.is(await oauthEndpoints.logout(ctx), undefined)
  expect(ctx.throw).to.have.been.called()
}) */

test('koa middleware should redirect on login for non-logged user', async t => {
  t.is(await oauthEndpoints.login(fakeCtx), undefined)
  expect(fakeCtx.redirect).to.have.been.called()
  t.not(fakeCtx.session.state, null)
})

test('koa middleware should throws error while authorize in invalid state', async t => {
  const expectedResult = 'var result = { error: "invalid-code-or-state", ' +
    'access_token: "", expires_in: 0, success: false }; ' +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(await oauthEndpoints.authorize(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should authorize success', async t => {
  t.not(fakeCtx.session.state, null)

  fakeCtx.query.code = fakes.code
  fakeCtx.query.state = fakeCtx.session.state
  t.is(await oauthEndpoints.authorize(fakeCtx), undefined)
  t.is(fakeCtx.session.state, null)

  const expectedResult = {
    access_token: fakes.accessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(fakeCtx.session[fakes.namespace], expectedResult)
})

test('koa middleware should throws error while login with already logged user', async t => {
  t.not(fakeCtx.session[fakes.namespace], undefined)

  const expectedResult = 'var result = { error: "user-already-logged", ' +
    'access_token: "", expires_in: 0, success: false }; ' +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(await oauthEndpoints.authorize(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should throws error while authorize with already logged user', async t => {
  t.not(fakeCtx.session[fakes.namespace], undefined)

  const expectedResult = 'var result = { error: "user-already-logged", ' +
    'access_token: "", expires_in: 0, success: false }; ' +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(await oauthEndpoints.login(fakeCtx), undefined)
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should return userinfo success', async t => {
  const expectedResult = {
    sub: fakes.userId
  }
  t.deepEqual(await oauthEndpoints.userinfo(fakeCtx), expectedResult)
})

test('koa middleware should return introspect success', async t => {
  const ininitalState = {
    access_token: fakes.accessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(fakeCtx.session[fakes.namespace], ininitalState)

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

  t.deepEqual(await oauthEndpoints.introspect(fakeCtx), expectedResult)
})

test('koa middleware should return refresh success', async t => {
  const ininitalState = {
    access_token: fakes.accessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(fakeCtx.session[fakes.namespace], ininitalState)

  t.is(await oauthEndpoints.refresh(fakeCtx), undefined)

  const expectedResult = {
    access_token: fakes.refreshedAccessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshedRefreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(fakeCtx.session[fakes.namespace], expectedResult)
})

test('koa middleware should return logout success', async t => {
  const ininitalState = {
    access_token: fakes.refreshedAccessToken,
    expires_in: fakes.expiresIn,
    id_token: fakes.idToken,
    refresh_token: fakes.refreshedRefreshToken,
    scope: fakes.scope.join(' '),
    token_type: fakes.tokenType
  }
  t.deepEqual(fakeCtx.session[fakes.namespace], ininitalState)

  t.is(await oauthEndpoints.logout(fakeCtx), undefined)

  t.is(fakeCtx.status, 204)
  t.is(fakeCtx.session[fakes.namespace], undefined)
})

test('koa middleware should return correct html response by default', t => {
  t.is(oauthEndpoints.setHtmlResponse(fakeCtx, {}), undefined)

  const expectedResult = 'var result = { error: "", ' +
    'access_token: "", expires_in: 0, success: true }; ' +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should return correct html response with success', t => {
  const params = {
    accessToken: fakes.accessToken,
    expiresIn: fakes.expiresIn
  }
  t.is(oauthEndpoints.setHtmlResponse(fakeCtx, params), undefined)

  const expectedResult = 'var result = { error: "", ' +
    `access_token: "${fakes.accessToken}", expires_in: ${fakes.expiresIn}, success: true }; ` +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, expectedResult)
})

test('koa middleware should return correct html response with error', t => {
  const errorCode = 'blah-blah-blah'
  const params = {
    errorCode: errorCode
  }
  t.is(oauthEndpoints.setHtmlResponse(fakeCtx, params), undefined)

  const expectedResult = `var result = { error: "${errorCode}", ` +
    'access_token: "", expires_in: 0, success: false }; ' +
    `var targetOrigin = "${fakes.targetOrigin}"`

  t.is(fakeCtx.type, 'html')
  t.is(fakeCtx.body, expectedResult)
})

test.after.always(t => {
  server.stop(() => t.pass())
})
