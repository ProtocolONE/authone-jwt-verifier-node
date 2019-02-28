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

const requestAuthenticator = koaOauthMiddleware.requestAuthenticator(jwtVerifier, fakes.namespace)

test.before(t => {
  server.start(() => t.pass())
})

test('should throws error when create requestAuthenticator without params', t => {
  const expectedResult = 'No jwtVerifier instance passed'
  const error = t.throws(() => { return koaOauthMiddleware.requestAuthenticator() })
  t.is(error.message, expectedResult)
})

test('should throws error when create requestAuthenticator without namespace param', t => {
  const expectedResult = 'No namespace passed'
  const error = t.throws(() => { return koaOauthMiddleware.requestAuthenticator(requestAuthenticator) })
  t.is(error.message, expectedResult)
})

test('koa middleware requestAuthenticator should throw ctx error if no auth header', async t => {
  const ctx = fakes.getFakeCtx()
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware requestAuthenticator should throw ctx error if auth header is invalid', async t => {
  const ctx = fakes.getFakeCtx()
  ctx.header.authorization = 'sfdsfdsfdsf'
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware requestAuthenticator should throw ctx error if auth header have wrong format', async t => {
  const ctx = fakes.getFakeCtx()
  ctx.header.authorization = 'Blah! ' + fakes.accessToken
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware requestAuthenticator should throw ctx error if auth token is expired', async t => {
  const ctx = fakes.getFakeCtx()
  ctx.header.authorization = `Bearer ${fakes.expiredAccessToken}`
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})

test('koa middleware authenticateRequest should call next if auth token is ok', async t => {
  const ctx = fakes.getFakeCtx()
  ctx.header.authorization = `Bearer ${fakes.accessToken}`
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.not.been.called()
  expect(next).to.have.been.called()
})

test.after.always(t => {
  server.stop(() => t.pass())
})
