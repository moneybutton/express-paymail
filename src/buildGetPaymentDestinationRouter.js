import express from 'express'
import asyncHandler from 'express-async-handler'
import { PaymailError } from './errors/PaymailError'
import HttpStatus from 'http-status-codes'
import * as helpers from './script-helpers'
import { VerifiableMessage } from '@moneybutton/paymail-client'

const HANDLE_VALIDATION_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const validateSignature = async (paymailClient, params) => {
  const message = VerifiableMessage.forBasicAddressResolution(
    {
      senderHandle: params.senderHandle,
      dt: params.dt,
      amount: params.amount,
      purpose: params.purpose
    }
  )

  if (!await paymailClient.isValidSignature(message, params.signature, params.senderHandle, params.pubkey)) {
    throw new PaymailError('Wrong signature', HttpStatus.BAD_REQUEST, 'bad-signature')
  }
}

const validateRequest = async (params, paymailClient, checkSignature) => {
  if (!params.senderHandle) {
    throw new PaymailError('Missing sender handle', HttpStatus.BAD_REQUEST, 'missing-sender-handle')
  }
  if (!HANDLE_VALIDATION_REGEX.test(params.senderHandle)) {
    throw new PaymailError('Invalid sender handle', HttpStatus.BAD_REQUEST, 'invalid-sender-handle')
  }
  if (!params.dt) {
    throw new PaymailError('Missing parameter dt', HttpStatus.BAD_REQUEST, 'missing-dt')
  }
  if (checkSignature) {
    if (!params.signature) {
      throw new PaymailError('Missing signature', HttpStatus.BAD_REQUEST, 'missing-signature')
    }

    await validateSignature(paymailClient, params)
  }
}

const checkContentType = (req, res, next) => {
  if (!req.is('application/json')) {
    throw new PaymailError('Wrong content type. It should be `application/json`', HttpStatus.BAD_REQUEST, 'wrong-content-type')
  }
  next()
}

const buildGetPaymentDestinationRouter = (config, ifPresent) => {
  if (config.getPaymentDestination) {
    const router = express.Router()
    router.post('/address/:paymail', checkContentType, asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const validateSignature = config.requestSenderValidation
      await validateRequest(req.body, config.paymailClient, validateSignature)
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

export { buildGetPaymentDestinationRouter }
