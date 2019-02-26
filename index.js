const Auth1Oauth = require('./lib/auth1-oauth')
const Auth1CacheLru = require('./lib/auth1-cache-lru')
const Auth1CacheRedis = require('./lib/auth1-cache-redis')

module.exports.auth1Oauth = (options, logger, cache) => {
  return new Auth1Oauth(options, logger, cache)
}

module.exports.auth1CacheLru = (options) => {
  return new Auth1CacheLru(options)
}

module.exports.auth1CacheRedis = (options) => {
  return new Auth1CacheRedis(options)
}
