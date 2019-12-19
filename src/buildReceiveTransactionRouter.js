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
        const txids = await config.receiveTransaction(localPart, domain, { transactions, metadata, reference })

        if (txids === null) {
          throw new PaymailError('Paymail not found.', HttpStatus.NOT_FOUND, 'not-found')
        }

        res.send(txids)
      }))

    ifPresent(router)
  }
}

export { buildReceiveTransactionRouter }
