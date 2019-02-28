'use strict'

// Abstract storage class

class Storage {
  constructor () {
    this.keyPrefix = 'a1t'
    this.cache = null
  }

  getKey (key) {
    return `${this.keyPrefix}:${key}`
  }

  async get (key) {
    const result = await this._get(this.getKey(key))
    if (typeof (result) === 'undefined') {
      return null
    }
    return JSON.parse(result)
  }

  async set (key, value, maxAge) {
    maxAge = ((maxAge || 0) * 1) || 0
    if (maxAge <= 0) {
      return
    }
    const typeOfValue = typeof (value)
    if ((value === null && typeOfValue === 'object') || typeOfValue === 'undefined') {
      return
    }
    await this._set(this.getKey(key), JSON.stringify(value), maxAge * 1000)
  }

  async del (key) {
    return this._del(this.getKey(key))
  }

  async _get (key) {
    return this.cache.get(key)
  }

  async _set (key, value, maxAge) {
    return this.cache.set(key, value, maxAge)
  }

  async _del (key) {
    return this.cache.del(key)
  }
}

module.exports = Storage
