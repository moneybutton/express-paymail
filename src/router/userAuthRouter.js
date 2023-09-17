// const express = require("express");
// const router = express.Router();
// const userAuthController = require("../controller/userAuthController.js");
// router.post("/oauth", userAuthController);
// module.exports = router;

const express = require("express");
const router = express.Router();
const {userAuthController , userInfo, appAuthController}= require("../controller/userAuthController.js");
const { generateKeyPair, sign } = require("../helper/helper.js");
router.post("/oauth/:paymailAddress", userAuthController);
router.post("/oauth/app/:paymailAddress", appAuthController);
router.post("/oauth/userinfo/:paymailAddress", userInfo);

router.post("/signup", async (req, res) => {
  try {
    const { username } = req.body;

    // Generate new ECDSA keys for the user
    const { privateKey, publicKey } = await generateKeyPair();

    // const newUser = new User({
    //   username,
    //   privateKey,
    //   publicKey,
    // });
    //save the key to the db for the user
    // await newUser.save();
    console.log({ privateKey, publicKey });
    // let token = await sign({ username }, privateKey);

    res.json({ message: "User created successfully", publicKey, privateKey });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
});

module.exports = router;
