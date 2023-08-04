// const { buildRouter } = require("./index.js");
// const express = require("express");

// const BASE_URL = "http://127.0.0.1:8080"; // The library needs to know
// // the actual url where the app is going to work

// const paymailRouter = buildRouter(BASE_URL, {
//   basePath: "/api/bsvalias",
//   getIdentityKey: async (name, domain) => {
//     // A paymail has the form `name@domain`. You can find the appropiate
//     // key using paymail data.
//     return "0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa"; // Some public key
//   },
//   getPaymentDestination: async (name, domain, body, helpers) => {
//     // This method have to return a valid bitcoin outputs. The third parameter is the
//     // body of the request and the fourth parameter is a js object containing handful
//     // methods to create outputs.
//     return helpers.p2pkhFromAddress("1FJJkRqyxTKAVX3dGFpddERt9XRbiSRZkL");
//   },
//   verifyPublicKeyOwner: async (name, domain, publicKeyToCheck) => {
//     // Returns true if the public key belongs to the user owning `name@domain`, false in
//     // any other case.
//     return "0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa" === publicKeyToCheck;
//   },
// });

// const app = express();
// app.use(express.json());
// app.use(paymailRouter);
// const userAuthRouter = require("./router/userAuthRouter.js");
// app.use("/api/bsvalias", userAuthRouter);

// // app.use("/", (req, res) => res.send("hijmunuhi"));

// app.listen("8080", () => {
//   console.log("Listening on port .");
// });


const { buildRouter } = require("./index.js");
const express = require("express");

const BASE_URL = "http://127.0.0.1:8080"; // The library needs to know
// the actual url where the app is going to work

const paymailRouter = buildRouter(BASE_URL, {
  basePath: "/api/bsvalias",
  getIdentityKey: async (name, domain) => {
    // A paymail has the form `name@domain`. You can find the appropiate
    // key using paymail data.
    return "0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa"; // Some public key
  },
  getPaymentDestination: async (name, domain, body, helpers) => {
    // This method have to return a valid bitcoin outputs. The third parameter is the
    // body of the request and the fourth parameter is a js object containing handful
    // methods to create outputs.
    return helpers.p2pkhFromAddress("1FJJkRqyxTKAVX3dGFpddERt9XRbiSRZkL");
  },
  verifyPublicKeyOwner: async (name, domain, publicKeyToCheck) => {
    // Returns true if the public key belongs to the user owning `name@domain`, false in
    // any other case.
    return "0335e5e7b86c12a4b5df082acb43ca7805382b58c805172bdef20ced310df845aa" === publicKeyToCheck;
  },
});

const app = express();
app.use(express.json());
// app.use(paymailRouter);
const userAuthRouter = require("./router/userAuthRouter.js");
app.use("/api/bsvalias", userAuthRouter);

// app.use("/", (req, res) => res.send("hijmunuhi"));

const port = 8080;
app.listen(port, () => {
  console.log(`App listening on the port: ${port}`);
});
