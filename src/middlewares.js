const { PaymailError } = require('./errors/PaymailError')
const HttpStatus = require('http-status-codes')

const checkContentType = (req, _res, next) => {
  if (!req.is('application/json')) {
    throw new PaymailError('Wrong content type. It should be `application/json`', HttpStatus.BAD_REQUEST, 'wrong-content-type')
  }
  next()
}

module.exports = {
  checkContentType
}
