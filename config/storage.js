const { Storage } = require("@google-cloud/storage");
const path = require("path");
const storage = new Storage({
  keyFilename: path.join(__dirname, "../speechCred.json"),
});
const bucket = storage.bucket("talkie");
module.exports = {
  bucket: bucket,
};
