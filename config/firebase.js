var admin = require("firebase-admin");

var serviceAccount = require("../chrome-extension-2893f-firebase.json");

const initializeFB = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

module.exports = {
  initializeFB: initializeFB,
};
