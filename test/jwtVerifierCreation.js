'use strict'

const test = require('ava')

const { JwtVerifier, StorageMemory } = require('..')
const config = require('./helpers/config')

test('should throws error when create JwtVerifier instance without options', t => {
  const expectedResult = 'Options not passed'
  const error = t.throws(() => { return new JwtVerifier() })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option issuer', t => {
  const expectedResult = "Required option 'clientId' not set"
  const options = {
    issuer: config.issuer
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option clientId', t => {
  const expectedResult = "Required option 'issuer' not set"
  const options = {
    clientId: config.clientId
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option clientSecret', t => {
  const expectedResult = "Required option 'issuer' not set"
  const options = {
    clientSecret: config.clientSecret
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with not all required options', t => {
  const expectedResult = "Required option 'redirectUrl' not set"
  const options = {
    issuer: config.issuer,
    clientSecret: config.clientSecret,
    clientId: config.clientId
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should create JwtVerifier instance success with only required options passed', t => {
  const options = {
    issuer: config.issuer,
    clientSecret: config.clientSecret,
    clientId: config.clientId,
    redirectUrl: config.redirectUrl
  }
  t.notThrows(() => { return new JwtVerifier(options) })
})

test('should create JwtVerifier instance success with all options passed', t => {
  const options = {
    issuer: config.issuer,
    clientSecret: config.clientSecret,
    clientId: config.clientId,
    redirectUrl: config.redirectUrl,
    scopes: config.scope
  }
  t.notThrows(() => { return new JwtVerifier(options) })
})

test('should create JwtVerifier instance success with all options and cache instance passed', t => {
  const options = {
    issuer: config.issuer,
    clientSecret: config.clientSecret,
    clientId: config.clientId,
    redirectUrl: config.redirectUrl,
    scopes: config.scope
  }
  t.notThrows(() => { return new JwtVerifier(options, new StorageMemory()) })
})
