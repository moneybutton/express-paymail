// const jwt = require("jsonwebtoken");

const JWT = require("jsonwebtoken");
const Fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const secretKeyJwt = "your_secret_key_here";
const verifyToken = (token, secretKey) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error.message);
    return null;
  }
};

async function userAuthController(req, res) {
  try {
    const obj = jwt.verify;
    const { appName, appHandle, permissions, purpose, signature } = req.body;
    console.log("req.body object");
    console.log(req.body);
    if (!appHandle) return res.send("Please provide appHandle"); // app paymail
    if (!appName) return res.send("Please provide appName");
    if (!permissions) return res.send("Please provide permissions");
    if (!purpose) return res.send("Please provide purpose");
    if (!signature) return res.send("Please provide signature");

    const decodedToken = verifyToken(signature, secretKeyJwt);
    let appConfigFromToken;
    if (decodedToken) {
      console.log("Decoded Token:", decodedToken);
      appConfigFromToken = decodedToken; // or decodedToken.appConfig
      console.log("Extracted appConfig:", appConfigFromToken);
    } else {
      console.log("Token verification failed.");
    }
    if(appConfigFromToken.appHandle!==appHandle)
    res.send("in valid app trying to access token");
    // const paymailAddress = req.params.paymailAddress; // userpaymail
    // console.log(paymailAddress);
    const secretKey =
      "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgoJnHyLoRPhTJBhdB\nvIA3CXiRK/SRP+QidMAmz5s6gLOhRANCAATUrvM9cOf5cIG3u3rJlWqangfIjdv/\nnzd8d+VlI9flVcuAIhJ+PD2g3kFa0NCWqUxFjwOXJlePQwcxm8PBKcmb\n-----END PRIVATE KEY-----\n";

    const payload = {
      //apphandle
      appHandle,
      permissions,
    };

    const expiresIn = "1h";

    const encodedToken = jwt.sign(payload, secretKey, { algorithm: "ES256", expiresIn });

    res.send({ encodedToken });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
}

async function userInfo(req, res) {
  try {
    const { headerToken } = req.headers;
    const userPaymail = req.params;
    console.log(userPaymail);
    // if(headerToekn===appToken) // this will work only after connecting a db with express auth.(appToken is the token stored in our db against every app)
    if (!headerToken) {
      return res.send("Request Denied due invalid credientials.");
    }
    // then we will search for user in express-payauth and check if the user exist then return the details other wise will ask them to register.
    res.json({
      name: "Name of user",
      capabilities: [
        "user public key",
        ["user transaction1", "user transaction2", "user transaction3", "user transaction4"],
      ],
    });
  } catch (error) {
    console.log(error.message);
  }
}

let appConfig = {
  appName: "Test Name",
  appHandle: "test Handle",
  permissions: [1, 2, 3],
  purpose: "sdfnj",
};

// const generateSign = (obj) => {
//   const secretKey = "public_key";
//   const dataToSign = JSON.stringify(obj); // Convert obj to a string
//   const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("hex");
//   console.log("Signature:", signature);
//   return signature;
// };

const generateSign = (obj, secretKeyJwt) => {
  const token = jwt.sign(obj, secretKeyJwt);
  console.log("JWT Token:", token);
  return token;
};



async function appAuthController(req, res) {
  try {
    const paymailAddress = req.params.paymailAddress;
    if (!paymailAddress) return res.send("plase provide userPaymail");
    const apiUrl = `http://localhost:8080/api/bsvalias/oauth/${paymailAddress}`;
    console.log(appConfig);
    const jwtToken = generateSign(appConfig,secretKeyJwt);
    appConfig = { ...appConfig, signature: jwtToken };
    console.log(appConfig);
    const response = await axios.post(apiUrl, appConfig);
    const ecdsaTokenFromResponse = response.data.encodedToken;
    res.send({ ecdsaToken: ecdsaTokenFromResponse });
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).send({ error: "An error occurred while processing the request." });
  }
}






module.exports = { userAuthController, appAuthController, userInfo };
