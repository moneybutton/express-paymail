const jwt = require("jsonwebtoken");

async function  userAuthController(req, res){
  try {
    const { appName, appHandle, permissions, purpose, signature } = req.body;
    if(!appHandle ) return res.send("plase provide Apphandle");
    if(!appName ) return res.send("plase provide appName");
    if(!permissions ) return res.send("plase provide persmissions");
    if(!purpose ) return res.send("plase provide purpose");
    if(!signature ) return res.send("plase provide signature");
    const secretKey = `aijdbeifefdfknd`;

    const payload = {
      appHandle,
      appName
    };

    const expiresIn = "1h";

    const token = jwt.sign(payload, secretKey, { expiresIn });
    jwt.verify(token,secretKey);
    res.send({ token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = userAuthController;
