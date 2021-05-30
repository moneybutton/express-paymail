const express = require('express')
const asyncHandler = require('express-async-handler')
const { PaymailError } = require('./errors/PaymailError')
const HttpStatus = require('http-status-codes')

const buildReceiveTransactionRouter = (config, ifPresent) => {
  if (config.receiveTransaction) {
    const router = express.Router()
    router.post('/receive-transaction/:paymail',
      asyncHandler(async (req, res) => {
        const { hex, reference, metadata } = req.body
        if (!hex) {
          throw new PaymailError('transaction hex missing', HttpStatus.BAD_REQUEST)
        }

        if (!metadata) {
          throw new PaymailError('metadata is missing', HttpStatus.BAD_REQUEST)
        }

        const [localPart, domain] = req.params.paymail.split('@')
        const txid = await config.receiveTransaction(localPart, domain, hex, reference, metadata)

        if (txid === null) {
          throw new PaymailError('Paymail not found.', HttpStatus.NOT_FOUND, 'not-found')
        }

        res.send({
          txid,
          message: 'ok'
        })
      }))

    ifPresent(router)
  }
}

module.exports = { buildReceiveTransactionRouter }
