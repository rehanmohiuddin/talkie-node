var express = require("express");
var app = express();
const path = require("path");
const httpServer = require("http").createServer(app);
const server = httpServer;
require("dotenv").config({ path: path.join(__dirname, ".env") });
var cors = require("cors");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const initRoutes = require("./views");
app.use(bodyParser.json({ type: ["application/json"] }));
app.use(express.urlencoded({ extended: true }));
initRoutes(app);

server.listen(process.env.PORT || 5000, () => {
  console.log("Server Started Port :" + process.env.PORT);
});
