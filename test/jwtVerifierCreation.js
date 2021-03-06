'use strict'

const test = require('ava')

const { JwtVerifier, StorageMemory } = require('..')

const fakes = require('../mock/fakes')

test('should throws error when create JwtVerifier instance without options', t => {
  const expectedResult = 'Options not passed'
  const error = t.throws(() => { return new JwtVerifier() })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option issuer', t => {
  const expectedResult = "Required option 'clientId' not set or empty"
  const options = {
    issuer: fakes.issuer
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option clientId', t => {
  const expectedResult = "Required option 'issuer' not set or empty"
  const options = {
    clientId: fakes.clientId
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with only one required option clientSecret', t => {
  const expectedResult = "Required option 'issuer' not set or empty"
  const options = {
    clientSecret: fakes.clientSecret
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should throws error when create JwtVerifier instance with not all required options', t => {
  const expectedResult = "Required option 'redirectUrl' not set"
  const options = {
    issuer: fakes.issuer,
    clientSecret: fakes.clientSecret,
    clientId: fakes.clientId
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should create JwtVerifier instance success with only required options passed', t => {
  const options = {
    issuer: fakes.issuer,
    clientSecret: fakes.clientSecret,
    clientId: fakes.clientId,
    redirectUrl: fakes.redirectUrl
  }
  t.notThrows(() => { return new JwtVerifier(options) })
})

test('should create JwtVerifier instance success with all options passed', t => {
  const options = {
    issuer: fakes.issuer,
    clientSecret: fakes.clientSecret,
    clientId: fakes.clientId,
    redirectUrl: fakes.redirectUrl,
    scopes: fakes.scope
  }
  t.notThrows(() => { return new JwtVerifier(options) })
})

test('should throws error when create JwtVerifier instance with all empty options passed', t => {
  const expectedResult = "Required option 'issuer' not set or empty"
  const options = {
    issuer: '',
    clientSecret: '',
    clientId: '',
    redirectUrl: ''
  }
  const error = t.throws(() => { return new JwtVerifier(options) })
  t.is(error.message, expectedResult)
})

test('should create JwtVerifier instance success with empty redirectUrl (but it may cause errors in future)', t => {
  const options = {
    issuer: fakes.issuer,
    clientSecret: fakes.clientSecret,
    clientId: fakes.clientId,
    redirectUrl: ''
  }
  t.notThrows(() => { return new JwtVerifier(options) })
})

test('should create JwtVerifier instance success with all options and cache instance passed', t => {
  const options = {
    issuer: fakes.issuer,
    clientSecret: fakes.clientSecret,
    clientId: fakes.clientId,
    redirectUrl: fakes.redirectUrl,
    scopes: fakes.scope
  }
  t.notThrows(() => { return new JwtVerifier(options, new StorageMemory()) })
})
