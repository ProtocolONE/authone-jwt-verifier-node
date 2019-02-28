'use strict'

const test = require('ava')

const { JwtVerifier } = require('../')

const fakes = require('./helpers/fakes')

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
