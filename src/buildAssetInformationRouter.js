const express = require('express')
const asyncHandler = require('express-async-handler')

const buildAssetInformationRouter = (config, ifPresent) => {
  const router = express.Router()

  if (config.assetInformation) {
    router.get('/asset/:paymail', asyncHandler(async (req, res) => {
      const assetInformation = await config.assetInformation(...req.params.paymail.split('@'))
      res.json(assetInformation)
    }))

    ifPresent(router)
  }
}

module.exports = { buildAssetInformationRouter }
