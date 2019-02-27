# AuthOne JWT verifier for Node.js

[![build status](https://img.shields.io/travis/ProtocolONE/authone-jwt-verifier-node.svg?branch=master)](https://travis-ci.com/ProtocolONE/authone-jwt-verifier-node)
[![codecov](https://codecov.io/gh/ProtocolONE/authone-jwt-verifier-node/branch/master/graph/badge.svg)](https://codecov.io/gh/ProtocolONE/authone-jwt-verifier-node)
[![license](https://img.shields.io/github/license/ProtocolONE/authone-jwt-verifier-node.svg)](LICENSE)

> Node.JS middleware for ProtocolONE's Auth1 server.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install authone-jwt-verifier-node
```

[yarn][]:

```sh
yarn add authone-jwt-verifier-node
```


## Usage

```js
const JwtVerifier = require('authone-jwt-verifier-node');

const verifierOptions = {
// ... 
};
const jwtVerifier = new JwtVerifier(verifierOptions)

// script
```


## Contributors

| Name               |
| ------------------ |
| **Evgeniy Strigo** |


## License

[MIT](LICENSE) © Evgeniy Strigo


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
