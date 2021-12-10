const multer = require("multer");
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const multipleUpload = multer({ storage: storage }).array("file");
const upload = multer({ storage: storage }).single("file");
module.exports = {
  singleUpload: upload,
  multipleUpload: multipleUpload,
};
