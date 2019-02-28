'use strict'

const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const mockServerPort = process.env.MOCK_SERVER_PORT || 3000

const getRequestId = () => Math.random().toString(36).substring(2) +
  Math.random().toString(36).substring(2)

const getRedirect = () => {
  function redirect () {
  }
  return chai.spy(redirect)
}

const getThrow = () => {
  return chai.spy(function () {
  })
}
const getNext = () => {
  function _next () {
  }
  return chai.spy(_next)
}

const getFakeCtx = (session, query, header) => {
  return {
    id: getRequestId(),
    log: console,
    session: session || {},
    query: query || {},
    header: header || {},
    body: undefined,
    status: 200,
    redirect: getRedirect(),
    throw: getThrow()
  }
}

const fakes = {
  getFakeCtx: getFakeCtx,
  getNext: getNext,

  mockServerPort: mockServerPort,
  issuer: `http://localhost:${mockServerPort}`,
  clientId: '5c6fc4888db4bc0001beacec',
  clientSecret: 'RUOuk4bkWFNljuZzqwq5zrs0GdCLY9U3MJqubuDViUv7XQzgiU84y288Jh0klK1Z',
  scope: ['oauth', 'offline'],
  redirectUrl: 'http://127.0.0.1/auth1/callback',
  namespace: 'auth1',
  tokenType: 'bearer',
  userId: 'b62klDf0HeiJdNMv8K263nfE',
  targetOrigin: '*',
  state: Math.random().toString(36).substring(2),
  expiresIn: 3600,
  exp: 1893455999,

  redisPort: 6379,
  redisHost: 'localhost',

  template: 'var result = { error: "{errorCode}", ' +
    'access_token: "{accessToken}", ' +
    'expires_in: {expiresIn}, success: {isSuccess} }; ' +
    'var targetOrigin = "{targetOrigin}"',

  basicAuthHeader: 'NWM2ZmM0ODg4ZGI0YmMwMDAxYmVhY2VjOlJVT3VrNGJrV0ZObGp1Wn' +
    'pxd3E1enJzMEdkQ0xZOVUzTUpxdWJ1RFZpVXY3WFF6Z2lVODR5Mjg4Smgwa2xLMVo=',

  code: 'gg7UCAqyyoKuxH2QgzPk5DUKiSQWTuNeh0k2vCpyF44.xOkBbGZwJV-yqHZ7J_Zw5' +
    'tHWVYQMpPvNuefYRA4OBD0',

  accessToken: 'hYCCQ-khwkvxtEy7wkxhcFMTuUcTtM_YgXvAo5pcEQ0.TfQ1_UxfxIw4Hn' +
    'VKMmIM8KvhN3CjMxmKJAohgnEjoWk',

  refreshedAccessToken: 'SAxFCxLGVNeW9-bwKQw9E4S3DBR4AfOeW7xwbLLbnlQ.Lcvm7' +
    'M_HAz8_H0f_GbPXGXU2Moh-92O4hjnCurx1NYQ',

  expiredAccessToken: 'hkLbj_DBpqTaL2NjuZxm1cBEjDqCi5C3mvXq7lJ7QhA.ewEZ6ti' +
    'eYnNlxuZpKvQkBE-kl0p74pKIH1wCKw0Sdp0',

  invalidClientAccessToken: '7QhA.ewEZ6tieYnNlxuZpKvQkBE-kl0p74pKIH1wCKw0S' +
    'dp0hkLbj_DBpqTaL2NjuZxm1cBEjDqCi5C3mvXq7lJ',

  refreshToken: 'uw9IMYmuufnUY-ZEeK9nDgc2i-a09xjMwbxxvfVmLs0.0Bc3yb5KJYMSl' +
    'sDwU0t2Z_e3lALBIzw6K7WpCz16FsI',

  refreshedRefreshToken: 'WbX6b_fa9RPEICxgHeFDFIZDuMTxT9iLyBDFKh4xROg.Bct3' +
    'Sl_w12_B1JeI5JBJmOJ-w1hG72Hv9Q4NTwrNAtY',

  idToken:
    'eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzplMTk2YjFhZS1kMGYyLTQ2YzgtYjRmN' +
    'S01N2Q1ODYxZWUyMjYiLCJ0eXAiOiJKV1QifQ.eyJhdF9oYXNoIjoiVk5OSlhScjdlclN' +
    'KZzRoZ1hpbzlpZyIsImF1ZCI6WyI1YzZmYzQ4ODhkYjRiYzAwMDFiZWFjZWMiXSwiYXV0' +
    'aF90aW1lIjoxNTUxMTgyMDkzLCJleHAiOjE1NTExODU2OTgsImlhdCI6MTU1MTE4MjA5O' +
    'CwiaXNzIjoiaHR0cHM6Ly9vYXV0aC50c3QucHJvdG9jb2wub25lLyIsImp0aSI6Ijc4Mm' +
    'FlMGYyLWJmODktNGM2YS1hN2M0LTdhN2I2MjBmYzYwYyIsIm5vbmNlIjoiIiwicmF0Ijo' +
    'xNTUxMTgyMDY2LCJzdWIiOiI1YzZmYzRhZThkYjRiYzAwMDFiZWFjZWQifQ.izZC4H_z6' +
    '8R3BAi6kpJ4b8ukgNDSkcpiN9Eo3DqjbVsAiCyWueC-6-lgzolumPx-BacGMawDF-k86x' +
    'iaJzg5bhBuVmPn64fSH32hA0-SheQSms_9g_zP0VQzl72TnOkIZKBKYoSAFSIDq3-_mSt' +
    'v_SrSMFCOUOoNPhsr-IQ96T3zWLv_vhDvYXYIJKx8vtKKfD6q9ReNqDDLqO2X4ICjfNpz' +
    'k8jmbcQ13d_Ey9zFJofaDYIPOW-FZE74sPBw50fCEXTnIWQE2LSOAep1VyihZPQniXk7f' +
    '17bXRd31w0jweZiQHpDELo3hADKZTkIMCASHzj-t1nZqzKjQutf70euhiRVA5Tz3spH1d' +
    'zN9V3EjaN_qSUx_PqACVMD8MXq_PSTf13r8J92gQmk-LETQSd4Bigm4-nPTpAQ6saP24n' +
    '6JQ69zncrDg2p_EI6FdDtBf3MUGdg9jqvar2Q8L1UjypI3_Z3JmQSsPfhhFHmB8ZlMAgq' +
    'uJP2Tg5Npu5yoDerI-pYyyp2gOUqvAM1x5fYr0qF9rUvaSECAq0EEaN60NjNAvaMRp8o-' +
    'dAVp0UbivIw1-AkL4JDVA8mCpnPP5bh3S0Ecze-EUIUGY7PslEmOIm3SxwyeJXNqFfcLW' +
    'Z_9x1j612xp-4l3G8XSVbq5VxzzZKcuqVha3rUtcAqQ3oAjdzAbt4',

  requestParams: {
    logger: console,
    headers: {
      'X-Request-ID': getRequestId()
    }
  }
}

module.exports = fakes
