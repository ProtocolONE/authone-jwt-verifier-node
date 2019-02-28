'use strict'

const Koa = require('koa')
const cors = require('koa2-cors')
const unless = require('koa-unless')
const Router = require('koa-router')
const Redis = require('ioredis')

const { JwtVerifier, StorageRedis, koaOauthMiddleware } = require('authone-jwt-verifier-node')

// requestAuthenticator middleware creation
// You must set your own values here
const verifierOptions = {
  issuer: 'https://auth1.protocol.one',
  clientId: '5c6fc4888db4bc0001beacec',
  clientSecret: 'RUOuk4bkWFNljuZzqwq5zrs0GdCLY9U3MJqubuDViUv7XQzgiU84y288Jh0klK1Z',
  redirectUrl: 'https://myapp.protocol.one',
  scopes: ['oauth', 'offline']
}

const namespace = 'auth1'

const redisInstance = new Redis('localhost', 3369)

const redisStorage = new StorageRedis(redisInstance)

const jwtVerifier = new JwtVerifier(verifierOptions, redisStorage)

const requestAuthenticator = koaOauthMiddleware.requestAuthenticator(jwtVerifier, namespace)
requestAuthenticator.unless = unless

const publicRoutes = {
  path: `/_healthz`
}

// Router setup
const router = new Router()
router
  .get('/_healthz', async (ctx, next) => {
    ctx.body = {
      page: 'public',
      authenticationNeed: false
    }
    next()
  })
  .get('/some-private-url', async (ctx, next) => {
    ctx.body = {
      page: 'private',
      authenticationNeed: true
    }
    next()
  })

// CORS setup
const nonCorsRoutes = ['/']
const corsValidOrigins = ['*']
const corsMiddleware = cors({
  origin: function (ctx) {
    if (nonCorsRoutes.includes(ctx.url)) {
      return false
    }
    if (corsValidOrigins.includes('*')) {
      return '*'
    }
    const requestOrigin = ctx.accept.headers.origin
    if (!corsValidOrigins.includes(requestOrigin)) {
      return ctx.throw(`${requestOrigin} is not a valid origin`)
    }
    return requestOrigin
  },
  maxAge: 5,
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
})

// App create and middleware setup
const app = new Koa()
app.use(corsMiddleware)

// requestAuthenticator middleware setup
app.use(requestAuthenticator.unless(publicRoutes))

app.use(router.routes())
app.use(router.allowedMethods())

const serverPort = 3000

// create server
const server = app.listen(serverPort, () => {
  console.log(`Server listening on port: ${serverPort}`)
})

module.exports = server
