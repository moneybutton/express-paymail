# @timechainlabs/express-payauth

## Description

This package intents to be a full implementation of BSV paymail specification
easy to plug in any expressjs app.


## Getting started

This is a minimal example of an express app using this package:

``` javascript
import { buildRouter } from '@moneybutton/express-paymail'
import express from 'express'

const BASE_URL = 'example.tls' // The library needs to know
                               // the actual url where the app is going to work

const paymailRouter = buildRouter(BASE_URL, {
  basePath: '/api/bsvalias',
  getIdentityKey: async (name, domain) => {
    // A paymail has the form `name@domain`. You can find the appropiate
    // key using paymail data.
    return '0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa' // Some public key
  },
  getPaymentDestination: async (name, domain, body, helpers) => {
    // This method have to return a valid bitcoin outputs. The third parameter is the
    // body of the request and the fourth parameter is a js object containing handful
    // methods to create outputs.
    return helpers.p2pkhFromAddress('1FJJkRqyxTKAVX3dGFpddERt9XRbiSRZkL')
  },
  verifyPublicKeyOwner: async (name, domain, publicKeyToCheck) => {
    // Returns true if the public key belongs to the user owning `name@domain`, false in
    // any other case.
    return '0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa' === publicKeyToCheck
  }
})

const app = express()
app.use(paymailRouter)

app.listen('3000', () => {
  logger.info(`Listening on port ${API_REST_PORT}.`)
})

```

This generates an app with the following endpoints:

endpoint | description
---------|------------
`/.well-known/bsvalias` | Api descriptor. Generated automatically.
`/api/bsvalias/id/{alias}@{domain.tld}` | Returns public key for a given paymail.
`/api/bsvalias/address/{alias}@{domain.tld}` | Returns an output to send money to a given paymail owner.
`/verifypubkey/{alias}@{domain.tld}/{pubkey}` | Checks if a given pubkey belongs to given paymail.
`/api/bsvalias/oauth/{user}@{domain.tld}` | app paymail requests user paymail for authorization to user's paymail capabilities
`/api/bsvalias/oauth/response/{app}@{domain.tld}` | user paymail is sending authorization JWT token to a particular app paymail
`/api/bsvalias/payauth/userinfo/{user}@{domain.tld}` | app paymail is requesting user paymail for protected userinfo data using JWT

1.
/api/bsvalias/oauth/{user}@{domain.tld}
INPUT BODY:
{
    "appName": "app name",
    "appHandle": "<app>@<appdomain.tld>",
    "dt": "<ISO-8601 timestamp>",
    "permissions": "list of comma seperated capabilities it wants access to",
    "purpose": "purpose for asking for capabilities",
    "signature": "<compact Bitcoin message signature>"
}

----- Paymail server triggers pop up in user agent to Get confirmation -------
---IF user agrees-----
ASYNC (Because User might take time to confirm or deny)
Response body:
{
    "access-token": "ESDSA JWT Token"
}

If request is timing out, respond with HTTP Status 202
, call /oauth/response to send the JWT to app paymail

{
  "token": "...",
  "signature": "..."
}


3. /api/bsvalias/oauth/response/{app}@{domain.tld}/
INPUT BODY:
{
  "token": "...",
  "access-token": "ESDSA JWT Token"
}

ECDSA JWT Token breakdown:
HEADER
{
  "alg": "ES256",
  "typ": "JWT"
}
payload: { 
"userpaymail" : user@domain.tld, 

"capabilities" : "string seperated list of capabilities identified by the part after /api/bsvalias/payauth/"

iss (issuer): user paymail server at domain.tld

sub (subject): paymail of the user (alias@domain.tld) (the user)

aud (audience): app paymail of app (app@domain.tld)

exp (expiration time): UNIX time

nbf (not before time): current UNIX time

iat (issued at time): current UNIX time

jti (JWT ID): UUID Of JWT

}
ECDSA Signature

3. /api/bsvalias/payauth/userinfo/{user}@{domain.tld}
HEADER:
{
  x-payauth: "ESDSA JWT Token"
}
RESPONSE:
{
  userinfo: {}
}
