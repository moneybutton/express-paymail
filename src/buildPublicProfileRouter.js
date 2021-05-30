const express = require('express')
const asyncHandler = require('express-async-handler')
const { PaymailError } = require('./errors/PaymailError')
const HttpStatus = require('http-status-codes')

const buildPublicProfileRouter = (config, ifPresent) => {
  if (config.publicProfile) {
    const router = express.Router()
    router.get('/public-profile/:paymail', asyncHandler(async (req, res) => {
      const [name, domain] = req.params.paymail.split('@')
      const size = isNaN(Number(req.query.s)) ? null : Number(req.query.s)
      const obj = await config.publicProfile(name, domain, size)

      if (!obj) {
        throw new PaymailError(`Paymail not found: ${req.params.paymail}.`, HttpStatus.NOT_FOUND, 'not-found')
      }

      res.send({
        name: obj.name,
        avatar: obj.avatar
      })
    }))

    ifPresent(router)
  }
}

module.exports = { buildPublicProfileRouter }
