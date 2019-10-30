import express from 'express'
import asyncHandler from 'express-async-handler'
import { PaymailError } from './errors/PaymailError'
import HttpStatus from 'http-status-codes'

const validateTransactions = (transactions) => {
  const validAttributes = transactions.every(tx => {
    const keys = Object.keys(tx)
    return keys.length === 1 && keys[0] === 'hex'
  })

  if (!validAttributes) {
    throw new PaymailError('invalid transaction format.', HttpStatus.BAD_REQUEST)
  }
}

const buildResponseHandlers = (req, res) => {
  return {
    ok: (txid, message = 'success') => {
      res.send({ txid, message })
    },
    paymentError: (message) => {
      throw new PaymailError(message, HttpStatus.UNPROCESSABLE_ENTITY, 'tx-error')
    },
    notFound: () => {
      throw new PaymailError(`Paymail not found: ${req.params.paymail}`, HttpStatus.NOT_FOUND, 'not-found')
    },
    unexpectedError: (message = 'unexpected error') => {
      throw new Error(message)
    }
  }
}

const buildReceiveTransactionRouter = (config, ifPresent) => {
  if (config.receiveTransaction) {
    const router = express.Router()
    router.post('/receive-transaction/:paymail',
      asyncHandler(async (req, res) => {
        const { transactions, metadata, reference } = req.body
        if (!transactions) {
          throw new PaymailError('transactions array missing', HttpStatus.BAD_REQUEST)
        }

        validateTransactions(transactions)

        if (!metadata) {
          throw new PaymailError('metadata is missing', HttpStatus.BAD_REQUEST)
        }
        const [localPart, domain] = req.params.paymail.split('@')
        await config.receiveTransaction(localPart, domain, { transactions, metadata, reference }, buildResponseHandlers(req, res))
      }))

    ifPresent(router)
  }
}

export { buildReceiveTransactionRouter }
