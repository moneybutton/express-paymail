const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ALGORITHM = "ES256";

function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  return {
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }),
    publicKey: publicKey.export({ type: "spki", format: "pem" }),
  };

  // fs.writeFileSync(`./keys/private_key_${userId}.pem`, privateKey.export({ type: "pkcs8", format: "pem" }));
  // fs.writeFileSync(`./keys/public_key_${userId}.pem`, publicKey.export({ type: "spki", format: "pem" }));
}

function getPrivateKey(userId) {
  // const privateKey = fs.readFileSync(`./keys/private_key_${userId}.pem`);
  // write the code to fetch the keys from db
  return privateKey;
}

function getPublicKey(userId) {
  // const publicKey = fs.readFileSync(`./keys/public_key_${userId}.pem`);
  // write the code to fetch the keys from db
  return publicKey;
}

function sign(payload, privateKey) {
  return jwt.sign(payload, privateKey, { algorithm: ALGORITHM });
}

function verify(token, publicKey) {
  return jwt.verify(token, publicKey, { algorithms: [ALGORITHM] });
}

module.exports = {
  generateKeyPair,
  getPrivateKey,
  getPublicKey,
  sign,
  verify,
};
