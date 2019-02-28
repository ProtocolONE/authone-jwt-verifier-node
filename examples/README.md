# Demo applications for authorization scenarios

This applications demonstrates basic authorization scenarios and middleware settings.


## Auth app

In [koa-auth-server.js](koa-auth-server.js) file you can see how to create a lightweight backend for your Single Page 
Application, that will helps you to perform user authentication, access token refresh and user logout

For make a user login, you must create subscribtion for receiving postMessages in your SPA, and then and open an 
`/login` url in iframe.
All process of authentication will go in that frame, and finally you will be redirected to `/callback` url.

As the result of authentication process you will receive a postMessage from iframe.  
Result will be a json-serialized object with auth token, expire time and error code if it occures.
Actual structure of object you may configure in `postMessageHtmlTemplate` endpoints option.
Also, targetOrigin of postMessage may be configured in `postMessageTargetOrigin` endpoints option.

Token, that you receive form postMessage, you must store in browser's local storage and  pass as bearer authorization 
header to all requests to your auth-protected API endpoints.

For refresh you must send ajax request to `GET /refresh`, and you will get json response with updated token. 

For logout you must send ajax request to `GET /logout`, this will revoke access and refresh tokens and destroy session.
Logout endpoint send `204 No content` status in case of success, and `500 Internal server error` on other cases 
(if user already logged out, for example, or not logged yet). In most cases you can ignore this error in your SPA

You do not need pass bearer authorization header to refresh and logout endpoints, because they are authorize yuor 
request by user session cookie. Be sure, that you enable send cookies with this requests in your's framework http 
client!

Also, good idea will be close refresh and logout endpoints with CORS Policy.


## API app

In [koa-api-server.js](koa-api-server.js) file you can see how to create API backend app, that will contains protected 
endpoints.

For make your endpoints protected, you must create an requestAuthenticator and use it as a koa middleware.

For pass authentication, you must send and bearer authorization header with actual access token.

If you also need some public endpoints, you may use koa-unless module, to set urls of public endpoints (by list, or 
by regexp) 


## Contributors

| Name               |
| ------------------ |
| **Evgeniy Strigo** |
