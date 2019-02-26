'use strict'

const LRU = require('lru-cache')

class Auth1CacheLru {
  constructor (options) {
    options = options || {}
    const defaultOptions = {
      max: 0, // infinity
      maxAge: 3600, // in seconds
      stale: false,
      keyPrefix: 'auth1OauthToken'
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.cache = new LRU(this.options)
  }

  getKey (key) {
    return `${this.options.keyPrefix}:${key}`
  }

  async get (key) {
    let result = this.cache.get(this.getKey(key))
    if (typeof (result) === 'undefined') {
      result = null
    }
    return JSON.parse(result)
  }

  async set (key, value) {
    this.cache.set(this.getKey(key), JSON.stringify(value), this.options.maxAge * 1000)
  }

  async del (key) {
    this.cache.del(this.getKey(key))
  }
}

module.exports = Auth1CacheLru
