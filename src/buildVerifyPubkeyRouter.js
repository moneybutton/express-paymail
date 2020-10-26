import express from 'express'
import asyncHandler from 'express-async-handler'
// import { PaymailError } from './errors/PaymailError'
// import HttpStatus from 'http-status-codes'

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

export { buildVerifyPubkeyRouter }
