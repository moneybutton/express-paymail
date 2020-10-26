import { PaymailError } from './errors/PaymailError'
import HttpStatus from 'http-status-codes'

const errorHandler = (err, req, res, next) => {
  if (err instanceof PaymailError) {
    res.status(err.status)
    res.send({
      code: err.code,
      message: err.message
    })
  } else {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR)
    res.send({
      code: 'internal-server-error',
      message: 'Something went wrong. Please try again later'
    })
  }
}

export { errorHandler }
