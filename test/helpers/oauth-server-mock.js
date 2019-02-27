'use strict'

const Koa = require('koa')
const Router = require('koa-router')
const convert = require('koa-convert')
const KoaBody = require('koa-body')

const config = require('./config')

const port = config.mockServerPort

const koaBody = convert(KoaBody({
  urlencoded: true
}))

const logPrefix = 'MOCK SERVER'

const router = new Router()
router
  .post(config.tokenPath, koaBody, async (ctx) => {
    console.log(logPrefix, 'Start request', 'POST', config.tokenPath)

    if (!ctx.header.authorization) {
      return ctx.throw(401)
    }

    const grantType = ctx.request.body.grant_type
    ctx.body = {
      access_token: config.accessToken,
      expires_in: config.expiresIn,
      id_token: config.idToken,
      refresh_token: config.refreshToken,
      scope: config.scope.join(' '),
      token_type: config.tokenType
    }
    if (grantType === 'refresh_token') {
      ctx.body.access_token = config.refreshedAccessToken
      ctx.body.refresh_token = config.refreshedRefreshToken
    }
    console.log(logPrefix, 'Finish request', 'POST', config.tokenPath, ctx.status, ctx.body)
  })

  .get(config.userinfoPath, koaBody, async (ctx) => {
    console.log(logPrefix, 'Start request', 'GET', config.userinfoPath)
    ctx.body = {
      sub: config.userId
    }
    console.log(logPrefix, 'Finish request', 'GET', config.userinfoPath, ctx.status, ctx.body)
  })

  .post(config.revokePath, koaBody, async (ctx) => {
    console.log(logPrefix, 'Start request', 'POST', config.revokePath)
    ctx.body = null
    console.log(logPrefix, 'Finish request', 'POST', config.revokePath, ctx.status, ctx.body)
  })

  .post(config.introspectPath, koaBody, async (ctx) => {
    console.log(logPrefix, 'Start request', 'POST', config.introspectPath)
    const token = ctx.request.body.token
    if (token === config.expiredAccessToken) {
      ctx.body = {
        'active': false
      }
    } else {
      const tokenType = token === config.refreshToken ? 'refresh_token' : 'access_token'

      ctx.body = {
        'active': true,
        'scope': config.scope.join(' '),
        'client_id': token === config.invalidClientAccessToken ? config.wrongClientId : config.clientId,
        'sub': config.userId,
        'exp': 1551191517,
        'iat': 1551187917,
        'iss': 'http://192.168.99.100:4444/',
        'token_type': tokenType
      }
    }
    console.log(logPrefix, 'Finish request', 'POST', config.introspectPath, ctx.status, ctx.body)
  })

  .post(config.dummyJsonRequestPath, koaBody, async (ctx) => {
    console.log(logPrefix, 'Start request', 'POST', config.dummyJsonRequestPath)
    ctx.body = ctx.request.body
    console.log(logPrefix, 'Finish request', 'POST', config.dummyJsonRequestPath, ctx.status, ctx.body)
  })

const app = new Koa()
app.use(router.routes())
app.use(router.allowedMethods())

const server = app.listen(port, () => {
  console.log(`Mock server listening on port: ${port}`)
})

module.exports = server
