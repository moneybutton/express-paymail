const express = require("express");
const router = express.Router();
const userAuthController = require("../controller/userAuthController.js");
router.post("/oauth", userAuthController);
module.exports = router;
