'use strict'

const Storage = require('../storage/storage')

class StorageRedis extends Storage {
  constructor (redisInstance) {
    if (!redisInstance) {
      throw new Error('Redis instance not passed to constructor')
    }
    super()
    this.cache = redisInstance
  }

  async _set (key, value, maxAge) {
    return this.cache.set(key, value, 'PX', maxAge)
  }
}

module.exports = StorageRedis
