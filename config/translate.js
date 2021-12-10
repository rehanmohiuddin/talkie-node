const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");

const _Translate = new Translate({
  keyFilename: path.join(__dirname, "../speechCred.json"),
});

module.exports = {
  gTranslate: _Translate,
};
