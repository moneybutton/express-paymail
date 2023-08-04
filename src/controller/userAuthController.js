// const jwt = require("jsonwebtoken");

const JWT = require('jsonwebtoken');
const Fs = require('fs');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

async function  userAuthController(req, res){
  try {
    const { appName, appHandle, permissions, purpose, signature } = req.body;
    if(!appHandle ) return res.send("plase provide Apphandle");
    if(!appName ) return res.send("plase provide appName");
    if(!permissions ) return res.send("plase provide persmissions");
    if(!purpose ) return res.send("plase provide purpose");
    if(!signature ) return res.send("plase provide signature");
    const paymailAddress = req.params.paymailAddress;
    console.log(paymailAddress);
    const secretKey = `aijdbeifefdfknd`;
    const payload = {
      paymailAddress,
      permissions,
    };

    const expiresIn = "1h";

    const encodedToken = JWT.sign(payload, "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnjx5D7Oaz+PJ1cuf\nnn7zXsKein+CSEFT2tC80ZBoW7qhRANCAAS2/q35PcgCuYShcuBMfF3W9gxoHxik\nxlg7HIcUTRO324Zisk2PNcX8uaK32Ho9aMNM8VZWpHWM5Eg259br2f2+\n-----END PRIVATE KEY-----\n", { algorithm: 'ES256' , expiresIn});
    // jwt.verify(token,secretKey);
    res.send({ encodedToken });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = userAuthController;


// async function userAuthController(req, res) {
//   try {
//     const { appName, appHandle, permissions, purpose, signature } = req.body;
//     if (!appHandle) return res.send("Please provide appHandle");
//     if (!appName) return res.send("Please provide appName");
//     if (!permissions) return res.send("Please provide permissions");
//     if (!purpose) return res.send("Please provide purpose");
//     if (!signature) return res.send("Please provide signature");

//     const secretKey = "your_secret_key_here"; // Replace with your actual secret key
//     const payload = {
//       appHandle,
//       appName,
//     };

//     const expiresIn = "1h";
//     const jwtToken = jwt.sign(payload, secretKey, { expiresIn });

//     // Generate ECDSA token using crypto module
//     const sign = crypto.createSign("sha256");
//     sign.update(jwtToken);
//     const ecdsaToken = sign.sign(secretKey, "base64");

//     res.send({ jwtToken, ecdsaToken });
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// }




//  userAuthController = (request, response) => {
//   // Read the private key
//   return Fs.readFile('./keys/private.key', 'utf8', (err, privateKey) => {
//     if (err) throw err;

//     // Read the public key
//     Fs.readFile('./keys/public.key', 'utf8', (err, publicKey) => {
//       if (err) throw err;

//       const payload = {
//         name: 'Tina',
//         email: 'info@tinaciousdesign.com'
//       };

//       // Sign the payload
//       const encodedToken = JWT.sign(payload, privateKey, { algorithm: 'ES256' });

//       return response.json({
//         public_key: publicKey,
//         encoded: encodedToken,
//       });
//     });
//   });
// };


// module.exports = userAuthController;

module.exports = userAuthController;
