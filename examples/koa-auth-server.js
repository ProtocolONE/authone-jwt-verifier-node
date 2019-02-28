'use strict'

const Koa = require('koa')
const cors = require('koa2-cors')
const Router = require('koa-router')
const session = require('koa-session2')
const Redis = require('ioredis')

const { JwtVerifier, StorageRedis, koaOauthMiddleware } = require('authone-jwt-verifier-node')

// oauth endpoints middleware creation
// You must set your own values here
const verifierOptions = {
  issuer: 'https://auth1.protocol.one',
  clientId: '5c6fc4888db4bc0001beacec',
  clientSecret: 'RUOuk4bkWFNljuZzqwq5zrs0GdCLY9U3MJqubuDViUv7XQzgiU84y288Jh0klK1Z',
  redirectUrl: 'https://myapp.protocol.one',
  scopes: ['oauth', 'offline']
}

const postMessageHtmlTemplate = '<script>var result = { error: "{errorCode}", ' +
  'access_token: "{accessToken}", ' +
  'expires_in: {expiresIn}, success: {isSuccess} }; ' +
  'var targetOrigin = "{targetOrigin}"</script>'

const endpointsOptions = {
  namespace: 'auth1',
  postMessageHtmlTemplate: postMessageHtmlTemplate,
  postMessageTargetOrigin: '*'
}

const redisInstance = new Redis('localhost', 3369)
const redisStorage = new StorageRedis(redisInstance)
const jwtVerifier = new JwtVerifier(verifierOptions, redisStorage)
const oauthEndpoints = koaOauthMiddleware.oauthEndpoints(jwtVerifier, endpointsOptions)

// Oauth routes setup
const router = new Router()
router
  .get('/login', oauthEndpoints.login)
  .get('/callback', oauthEndpoints.authorize)
  .get('/refresh', oauthEndpoints.refresh)
  .get('/logout', oauthEndpoints.logout)

// CORS setup
const corsRoutes = ['/refresh', '/logout']
const corsValidOrigins = ['*']
const corsMiddleware = cors({
  origin: function (ctx) {
    if (!corsRoutes.includes(ctx.url)) {
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
  allowMethods: ['GET', 'OPTIONS'],
  maxAge: 5,
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
})

// App create and middleware setup
const app = new Koa()
app.keys = ['sessionCookieSignKey']
app.use(session({
  signed: true,
  httpOnly: true
}))
app.use(corsMiddleware)
app.use(router.routes())
app.use(router.allowedMethods())

const serverPort = 3000

// create server
const server = app.listen(serverPort, () => {
  console.log(`Server listening on port: ${serverPort}`)
})

module.exports = server
