'use strict'

const test = require('ava')

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

test('should throw error on oauth server request, it is unreachable', async t => {
  const expectedResult = 'connect ECONNREFUSED 127.0.0.1:3000'
  const error = await t.throwsAsync(async () => {
    return jwtVerifier.exchange(config.code)
  })
  t.is(error.message, expectedResult)
})
