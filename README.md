# authone-middleware-node

[![build status](https://img.shields.io/travis/ProtocolONE/authone-middleware-node.svg?branch=master)](https://travis-ci.com/ProtocolONE/authone-middleware-node)
[![codecov](https://codecov.io/gh/ProtocolONE/authone-middleware-node/branch/master/graph/badge.svg)](https://codecov.io/gh/ProtocolONE/authone-middleware-node)
[![license](https://img.shields.io/github/license/ProtocolONE/authone-middleware-node.svg)](LICENSE)

> Node.JS middleware for ProtocolONE's Auth1 server.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install authone-middleware-node
```

[yarn][]:

```sh
yarn add authone-middleware-node
```


## Usage

```js
const auth1Middleware = require('authone-middleware-node');

const middlewareOptions = {
// ... 
};
const auth1 = auth1Middleware(middlewareOptions)

// script
```


## Contributors

| Name               |
| ------------------ |
| **Evgeniy Strigo** |


## License

[Apache-2.0](LICENSE) © Evgeniy Strigo


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
