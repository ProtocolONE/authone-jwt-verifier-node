const Auth1Oauth = require('./lib/auth1-oauth')
const Auth1CacheLru = require('./lib/auth1-cache-lru')
const Auth1CacheRedis = require('./lib/auth1-cache-redis')
const auth1KoaMiddleware = require('./lib/auth1-koa-middleware')

module.exports.auth1Oauth = (options, cache) => {
  return new Auth1Oauth(options, cache)
}

module.exports.auth1CacheLru = (options) => {
  return new Auth1CacheLru(options)
}

module.exports.auth1CacheRedis = (options) => {
  return new Auth1CacheRedis(options)
}

module.exports.auth1KoaMiddleware = auth1KoaMiddleware
