const express = require("express");
const { singleUpload } = require("../utils/multer");
const router = express.Router();
const { download, uploadToGS } = require("../controllers/transcription");
const {
  postComment,
  getComments,
  replyToComment,
} = require("../controllers/comments");
const { translate } = require("../controllers/translation");

let routes = (app) => {
  router.post("/upload", singleUpload, uploadToGS);
  router.get("/files/:name", download);
  router.post("/comment", singleUpload, postComment);
  router.get("/comments", getComments);
  router.post("/comment/reply", replyToComment);
  router.post("/translate", translate);
  app.use("/recording", router);
};

module.exports = routes;
