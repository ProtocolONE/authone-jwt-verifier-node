const mockServerPort = process.env.MOCK_SERVER_PORT || 3000

const config = {
  mockServerPort: mockServerPort,
  authorizePath: '/oauth2/authorize',
  tokenPath: '/oauth2/token',
  revokePath: '/oauth2/revoke',
  userinfoPath: '/userinfo',
  introspectPath: '/oauth2/introspect',
  publicHost: `http://localhost:${mockServerPort}`,
  privateHost: `http://localhost:${mockServerPort}`,
  clientId: '5c6fc4888db4bc0001beacec',
  wrongClientId: '4bc0001beacec5c6fc4888db',
  clientSecret: 'RUOuk4bkWFNljuZzqwq5zrs0GdCLY9U3MJqubuDViUv7XQzgiU84y288Jh0klK1Z',
  scope: ['oauth', 'offline'],
  redirectUri: 'http://127.0.0.1/auth1/callback',
  state: Math.random().toString(36).substring(2),
  code: 'gg7UCAqyyoKuxH2QgzPk5DUKiSQWTuNeh0k2vCpyF44.xOkBbGZwJV-yqHZ7J_Zw5tHWVYQMpPvNuefYRA4OBD0',
  accessToken: 'hYCCQ-khwkvxtEy7wkxhcFMTuUcTtM_YgXvAo5pcEQ0.TfQ1_UxfxIw4HnVKMmIM8KvhN3CjMxmKJAohgnEjoWk',
  refreshedAccessToken: 'SAxFCxLGVNeW9-bwKQw9E4S3DBR4AfOeW7xwbLLbnlQ.Lcvm7M_HAz8_H0f_GbPXGXU2Moh-92O4hjnCurx1NYQ',
  expiredAccessToken: 'hkLbj_DBpqTaL2NjuZxm1cBEjDqCi5C3mvXq7lJ7QhA.ewEZ6tieYnNlxuZpKvQkBE-kl0p74pKIH1wCKw0Sdp0',
  invalidClientAccessToken: '7QhA.ewEZ6tieYnNlxuZpKvQkBE-kl0p74pKIH1wCKw0Sdp0hkLbj_DBpqTaL2NjuZxm1cBEjDqCi5C3mvXq7lJ',
  expiresIn: 3600,
  idToken:
    'eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzplMTk2YjFhZS1kMGYyLTQ2YzgtYjRmNS01N2Q1ODYxZWUyMjYiLCJ0eXAiOiJKV1QifQ.eyJhdF9oYXNoIjoiVk5OSlhScjdlclNKZzRoZ1hpbzlpZyIsImF1ZCI6WyI1YzZmYzQ4ODhkYjRiYzAwMDFiZWFjZWMiXSwiYXV0aF90aW1lIjoxNTUxMTgyMDkzLCJleHAiOjE1NTExODU2OTgsImlhdCI6MTU1MTE4MjA5OCwiaXNzIjoiaHR0cHM6Ly9vYXV0aC50c3QucHJvdG9jb2wub25lLyIsImp0aSI6Ijc4MmFlMGYyLWJmODktNGM2YS1hN2M0LTdhN2I2MjBmYzYwYyIsIm5vbmNlIjoiIiwicmF0IjoxNTUxMTgyMDY2LCJzdWIiOiI1YzZmYzRhZThkYjRiYzAwMDFiZWFjZWQifQ.izZC4H_z68R3BAi6kpJ4b8ukgNDSkcpiN9Eo3DqjbVsAiCyWueC-6-lgzolumPx-BacGMawDF-k86xiaJzg5bhBuVmPn64fSH32hA0-SheQSms_9g_zP0VQzl72TnOkIZKBKYoSAFSIDq3-_mStv_SrSMFCOUOoNPhsr-IQ96T3zWLv_vhDvYXYIJKx8vtKKfD6q9ReNqDDLqO2X4ICjfNpzk8jmbcQ13d_Ey9zFJofaDYIPOW-FZE74sPBw50fCEXTnIWQE2LSOAep1VyihZPQniXk7f17bXRd31w0jweZiQHpDELo3hADKZTkIMCASHzj-t1nZqzKjQutf70euhiRVA5Tz3spH1dzN9V3EjaN_qSUx_PqACVMD8MXq_PSTf13r8J92gQmk-LETQSd4Bigm4-nPTpAQ6saP24n6JQ69zncrDg2p_EI6FdDtBf3MUGdg9jqvar2Q8L1UjypI3_Z3JmQSsPfhhFHmB8ZlMAgquJP2Tg5Npu5yoDerI-pYyyp2gOUqvAM1x5fYr0qF9rUvaSECAq0EEaN60NjNAvaMRp8o-dAVp0UbivIw1-AkL4JDVA8mCpnPP5bh3S0Ecze-EUIUGY7PslEmOIm3SxwyeJXNqFfcLWZ_9x1j612xp-4l3G8XSVbq5VxzzZKcuqVha3rUtcAqQ3oAjdzAbt4',
  refreshToken: 'uw9IMYmuufnUY-ZEeK9nDgc2i-a09xjMwbxxvfVmLs0.0Bc3yb5KJYMSlsDwU0t2Z_e3lALBIzw6K7WpCz16FsI',
  refreshedRefreshToken: 'WbX6b_fa9RPEICxgHeFDFIZDuMTxT9iLyBDFKh4xROg.Bct3Sl_w12_B1JeI5JBJmOJ-w1hG72Hv9Q4NTwrNAtY',
  tokenType: 'bearer',
  userId: 'b62klDf0HeiJdNMv8K263nfE',
  redisHost: 'localhost'
}

module.exports = config
