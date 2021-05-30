const express = require('express')
const asyncHandler = require('express-async-handler')
const HttpStatus = require('http-status-codes')
const { PaymailError } = require('./errors/PaymailError')
const { checkContentType } = require('./middlewares')

const buildP2pPaymentDestinationTokenRouter = (config, ifPresent) => {
  if (config.getP2pPaymentDestinationWithTokensSupport) {
    const router = express.Router()

    router.post('/p2p-payment-destination-tokens-support/:paymail', checkContentType, asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const { amount, asset, protocol } = req.body

      if (!amount) {
        throw new PaymailError('"amount" parameter is missing', HttpStatus.BAD_REQUEST, 'missing-amount')
      }

      const response = await config.getP2pPaymentDestinationWithTokensSupport(name, domain, amount, asset, protocol)
      if (response === null) {
        throw new PaymailError(`Paymail not found: ${req.params.paymail}`, HttpStatus.NOT_FOUND, 'not-found')
      }

      if (response.outputs.length === 0) {
        throw new PaymailError(`The list outputs cannot be empty`, HttpStatus.INTERNAL_SERVER_ERROR, 'error')
      }

      if (!response.reference) {
        throw new PaymailError('Tx reference cannot be empty', HttpStatus.INTERNAL_SERVER_ERROR, 'error')
      }

      res.send({
        outputs: response.outputs,
        reference: response.reference
      })
    }))

    ifPresent(router)
  }
}

module.exports = { buildP2pPaymentDestinationTokenRouter }
