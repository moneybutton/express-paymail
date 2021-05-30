const express = require('express')
const asyncHandler = require('express-async-handler')
// const { PaymailError } = require('./errors/PaymailError')
// const HttpStatus = require('http-status-codes')

const buildVerifyPubkeyRouter = (config, ifPresent) => {
  if (config.verifyPublicKeyOwner) {
    const router = express.Router()
    router.get('/verifypubkey/:paymail/:pubkey', asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const pubkey = req.params.pubkey
      const matchReponse = await config.verifyPublicKeyOwner(name, domain, pubkey)

      res.send({
        bsvalias: '1.0',
        handle: req.params.paymail,
        pubkey,
        match: !!matchReponse
      })
    }))

    ifPresent(router)
  }
}

module.exports = { buildVerifyPubkeyRouter }
