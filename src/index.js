import express from 'express'
import asyncHandler from 'express-async-handler'
import bodyParser from 'body-parser'
import { buildGetAddressRouter } from './buildGetAddressRouter'
import { buildIdentityRouter } from './buildIndentityRouter'
import { buildVerifyPubkeyRouter } from './buildVerifyPubkeyRouter'
import { errorHandler } from './error-handler'
import { PaymailClient } from '@moneybutton/paymail-client'
import dns from 'dns'
import fetch from 'isomorphic-fetch'
// import urltools from 'url'
import urljoin from 'url-join'

const getBaseRoute = (config) => {
  return config.basePath || '/'
}

const joinUrls = (...parts) => {
  return urljoin(...parts)
}

const validateBaseUrl = (url) => {
  try {
    url = new URL(url)
    if (url.protocol !== 'https:' && /^locahost:?\d*$/.test(url.hostname)) {
      console.warn('Paymail should always use ssl on production')
    }
    return url
  } catch (err) {
    throw new Error(`Invalid base url: ${url}`, err)
  }
}

const buildPaymailRouter = (baseUrl, config) => {
  const baseRouter = express.Router()
  baseRouter.use(bodyParser.json({ type: 'application/json' }))
  const apiRouter = express.Router()
  baseUrl = validateBaseUrl(baseUrl)

  const capabilities = {}

  buildIdentityRouter(config, (router) => {
    apiRouter.use(router)
    capabilities.pki = joinUrls(baseUrl.href, getBaseRoute(config), '/id/{alias}@{domain.tld}')
  })

  buildGetAddressRouter(config, (router) => {
    apiRouter.use(router)
    capabilities.paymentDestination = joinUrls(baseUrl.href, getBaseRoute(config), '/address/{alias}@{domain.tld}')
  })

  buildVerifyPubkeyRouter(config, (router) => {
    apiRouter.use(router)
    capabilities.verifyPublicKeyOwner = joinUrls(baseUrl.href, getBaseRoute(config), '/verifypubkey/{alias}@{domain.tld}/{pubkey}')
  })

  baseRouter.get('/.well-known/bsvalias', asyncHandler(async (req, res) => {
    res.type('application/json')
    res.send({
      bsvalias: '1.0',
      capabilities
    })
  }))

  baseRouter.use(getBaseRoute(config), apiRouter)

  baseRouter.use(errorHandler)

  return baseRouter
}

const buildRouter = (baseDomain, config) => {
  return buildPaymailRouter(baseDomain,
    {
      paymailClient: new PaymailClient(dns, fetch),
      ...config
    }
  )
}

export { buildRouter }
