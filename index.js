const Auth1Client = require('./lib/auth1')
const CacheLru = require('./lib/cache-lru')
const CacheRedis = require('./lib/cache-redis')

module.exports.auth1Middleware = (options, logger, cache) => {
  return new Auth1Client(options, logger, cache)
}

module.exports.auth1CacheLru = (options) => {
  return new CacheLru(options)
}

module.exports.auth1CacheRedis = (options) => {
  return new CacheRedis(options)
}
