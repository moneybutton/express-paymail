import express from 'express'
import asyncHandler from 'express-async-handler'
import { PaymailError } from './errors/PaymailError'
import HttpStatus from 'http-status-codes'

const buildIdentityRouter = (config, ifPresent) => {
  if (config.getIdentityKey) {
    const router = express.Router()

    router.get('/id/:paymail', asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const pubkey = await config.getIdentityKey(name, domain)

      if (!pubkey) {
        throw new PaymailError(`Paymail not found: ${req.params.paymail}`, HttpStatus.NOT_FOUND, 'not-found')
      }

      res.send({
        bsvalias: '1.0',
        handle: req.params.paymail,
        pubkey
      })
    }))

    ifPresent(router)
  }
}

export { buildIdentityRouter }
