import express from 'express'
import asyncHandler from 'express-async-handler'
import HttpStatus from 'http-status-codes'
import { PaymailError } from './errors/PaymailError'

const checkContentType = (req, _res, next) => {
  if (!req.is('application/json')) {
    throw new PaymailError('Wrong content type. It should be `application/json`', HttpStatus.BAD_REQUEST, 'wrong-content-type')
  }
  next()
}

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

export { buildP2pPaymentDestinationRouter }
