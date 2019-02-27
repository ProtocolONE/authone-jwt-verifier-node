'use strict'

const test = require('ava')
const Redis = require('ioredis')
const config = require('./helpers/config')

const { StorageRedis } = require('..')

let storageRedis

const redisInstance = new Redis(config.redisPort, config.redisHost)

test('should throws error when create instance without params', t => {
  const error = t.throws(() => { return new StorageRedis() })
  t.is(error.message, 'Redis instance not passed to constructor')
})

test('should create instance success', t => {
  t.notThrows(() => { return new StorageRedis(redisInstance) })
})

test.before(t => {
  storageRedis = new StorageRedis(redisInstance)
  t.pass()
})

test('should set value success and return it', async t => {
  const key = 'key'
  const value = 'value'
  await storageRedis.set(key, value, 10)
  t.is(await storageRedis.get(key), value)
})

test('should not set value if maxAge not passed', async t => {
  const key = 'key1'
  const value = 'value'
  await storageRedis.set(key, value)
  t.is(await storageRedis.get(key), null)
})

test('should not set value if maxAge = 0', async t => {
  const key = 'key2'
  const value = 'value'
  await storageRedis.set(key, value, 0)
  t.is(await storageRedis.get(key), null)
})

test('should not set value if maxAge < 0', async t => {
  const key = 'key3'
  const value = 'value'
  await storageRedis.set(key, value, -10)
  t.is(await storageRedis.get(key), null)
})

test('should not set value if maxAge is non-number', async t => {
  const key = 'key4'
  const value = 'value'
  await storageRedis.set(key, value, 'dsfdsfsf')
  t.is(await storageRedis.get(key), null)
})

test('should not set null value', async t => {
  const key = 'key5'
  const value = null
  await storageRedis.set(key, value, 10)
  t.is(await storageRedis.get(key), null)
})

test('should not set undefined value', async t => {
  const key = 'key6'
  const value = undefined
  await storageRedis.set(key, value, 10)
  t.is(await storageRedis.get(key), null)
})

test('should delete value', async t => {
  const key = 'key7'
  const value = 'value'
  await storageRedis.set(key, value, 10)
  t.is(await storageRedis.get(key), value)
  await storageRedis.del(key)
  t.is(await storageRedis.get(key), null)
})
