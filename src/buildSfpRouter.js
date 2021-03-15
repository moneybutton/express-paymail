import express from 'express'
import asyncHandler from 'express-async-handler'

const buildSfpRouter = (config, ifPresent) => {
  const router = express.Router()

  if (config.sfpBuildAction && config.sfpAuthoriseAction) {
    router.post('/sfp/build', asyncHandler(async (req, res) => {
      const response = await config.sfpBuildAction(req.body.hex, req.body.outputs)

      res.json(response)
    }))
  
    router.post('/sfp/authorise', asyncHandler(async (req, res) => {
      const response = await config.sfpAuthoriseAction(req.body.hex)

      res.json(response)
    }))

    ifPresent(router)
  }

}

export { buildSfpRouter }
