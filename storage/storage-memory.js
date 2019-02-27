'use strict'

const LRU = require('lru-cache')
const Storage = require('../storage/storage')

class StorageMemory extends Storage {
  constructor () {
    super()

    const options = {
      max: 0, // infinity items in storage
      stale: false
    }
    this.cache = new LRU(options)
  }
}

module.exports = StorageMemory
