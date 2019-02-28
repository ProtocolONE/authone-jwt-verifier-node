'use strict'

const test = require('ava')

const { StorageMemory } = require('..')

let storageMemory

test('should create instance success', t => {
  t.notThrows(() => { return new StorageMemory() })
})

test.before(t => {
  storageMemory = new StorageMemory()
  t.pass()
})

test('should set value success and return it', async t => {
  const key = 'key'
  const value = 'value'
  await storageMemory.set(key, value, 10)
  t.is(await storageMemory.get(key), value)
})

test('should not set value if maxAge not passed', async t => {
  const key = 'key1'
  const value = 'value'
  await storageMemory.set(key, value)
  t.is(await storageMemory.get(key), null)
})

test('should not set value if maxAge = 0', async t => {
  const key = 'key2'
  const value = 'value'
  await storageMemory.set(key, value, 0)
  t.is(await storageMemory.get(key), null)
})

test('should not set value if maxAge < 0', async t => {
  const key = 'key3'
  const value = 'value'
  await storageMemory.set(key, value, -10)
  t.is(await storageMemory.get(key), null)
})

test('should not set value if maxAge is non-number', async t => {
  const key = 'key4'
  const value = 'value'
  await storageMemory.set(key, value, 'dsfdsfsf')
  t.is(await storageMemory.get(key), null)
})

test('should not set null value', async t => {
  const key = 'key5'
  const value = null
  await storageMemory.set(key, value, 10)
  t.is(await storageMemory.get(key), null)
})

test('should not set undefined value', async t => {
  const key = 'key6'
  const value = undefined
  await storageMemory.set(key, value, 10)
  t.is(await storageMemory.get(key), null)
})

test('should delete value', async t => {
  const key = 'key7'
  const value = 'value'
  await storageMemory.set(key, value, 10)
  t.is(await storageMemory.get(key), value)
  await storageMemory.del(key)
  t.is(await storageMemory.get(key), null)
})
