'use strict'

const Redis = require('ioredis')

class CacheRedis {
  constructor (options) {
    options = options || {}
    const defaultOptions = {
      host: '',
      port: '6379',
      maxAge: 3600, // in seconds
      keyPrefix: 'oauthToken'
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.cache = new Redis(this.options.port, this.options.host)
  }

  getKey (key) {
    return `${this.options.keyPrefix}:${key}`
  }

  async get (key) {
    const result = await this.cache.get(this.getKey(key))
    return JSON.parse(result)
  }

  async set (key, value) {
    this.cache.set(this.getKey(key), JSON.stringify(value), 'EX', this.options.maxAge)
  }

  async del (key) {
    this.cache.del(this.getKey(key))
  }
}

module.exports = CacheRedis
