'use strict'

const test = require('ava')
const chai = require('chai')

const { JwtVerifier, koaOauthMiddleware } = require('../')

const fakes = require('./helpers/fakes')

const expect = chai.expect

const verifierOptions = {
  issuer: fakes.issuer,
  clientId: fakes.clientId,
  clientSecret: fakes.clientSecret,
  redirectUrl: fakes.redirectUrl,
  scopes: fakes.scope
}

const jwtVerifier = new JwtVerifier(verifierOptions)

test('should throw error on oauth server request, it is unreachable', async t => {
  const expectedResult = 'connect ECONNREFUSED 127.0.0.1:3000'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.exchange(fakes.code)
  })
  t.is(error.message, expectedResult)
})

const requestAuthenticator = koaOauthMiddleware.requestAuthenticator(jwtVerifier, fakes.namespace)

test('koa middleware authenticateRequest should fail if oauth server is unreachable', async t => {
  const ctx = fakes.getFakeCtx()
  ctx.header.authorization = `Bearer ${fakes.accessToken}`
  const next = fakes.getNext()
  t.is(await requestAuthenticator(ctx, next), undefined)
  expect(ctx.throw).to.have.been.called()
  expect(next).to.have.not.been.called()
})
