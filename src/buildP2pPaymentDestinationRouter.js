const express = require('express')
const asyncHandler = require('express-async-handler')
const HttpStatus = require('http-status-codes')
const { PaymailError } = require('./errors/PaymailError')
const { checkContentType } = require('./middlewares')

const buildP2pPaymentDestinationRouter = (config, ifPresent) => {
  if (config.getP2pPaymentDestination) {
    const router = express.Router()

    router.post('/p2p-payment-destination/:paymail', checkContentType, asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const { satoshis } = req.body

      if (!satoshis) {
        throw new PaymailError('"satoshis" parameter is missing', HttpStatus.BAD_REQUEST, 'missing-satoshis')
      }

      const response = await config.getP2pPaymentDestination(name, domain, satoshis)

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

module.exports = { buildP2pPaymentDestinationRouter }
