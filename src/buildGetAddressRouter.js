import express from 'express'
import asyncHandler from 'express-async-handler'
import { PaymailError } from './errors/PaymailError'
import HttpStatus from 'http-status-codes'
import * as helpers from './script-helpers'
import { VerifiableMessage } from '@moneybutton/paymail-client'

const validateRequest = async (params, paymailClient) => {
  if (!params.signature) {
    throw new PaymailError('Missing signature', HttpStatus.BAD_REQUEST, 'missing-signature')
  }
  if (!params.senderPaymail) {
    throw new PaymailError('Missing sender paymail', HttpStatus.BAD_REQUEST, 'missing-sender-paymail')
  }
  if (!/^\S+@\S+.\S+$/.test(params.senderPaymail)) {
    throw new PaymailError('Invalid sender paymail', HttpStatus.BAD_REQUEST, 'invalid-sender-paymail')
  }
  if (!params.dt) {
    throw new PaymailError('Missing parameter dt', HttpStatus.BAD_REQUEST, 'missing-dt')
  }

  const message = VerifiableMessage.forBasicAddressResolution(
    {
      senderPaymail: params.senderPaymail,
      dt: params.dt,
      amount: params.amount,
      purpose: params.purpose
    }
  )
  if (!await paymailClient.isValidSignature(message, params.signature, params.senderPaymail, params.pubkey)) {
    throw new PaymailError('Wrong signature', HttpStatus.BAD_REQUEST, 'bad-signature')
  }
}

const buildGetAddressRouter = (config, ifPresent) => {
  if (config.getPaymentDestination) {
    const router = express.Router()
    router.post('/address/:paymail', asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      await validateRequest(req.body, config.paymailClient)
      const output = await config.getPaymentDestination(name, domain, req.body, helpers)

      if (!output) {
        throw new PaymailError(`Paymail not found: ${req.params.paymail}`, HttpStatus.NOT_FOUND, 'not-found')
      }

      res.send({
        output
      })
    }))

    ifPresent(router)
  }
}

export { buildGetAddressRouter }
