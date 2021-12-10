const speech = require("@google-cloud/speech");
const path = require("path");

const Speech = () => {
  return new speech.SpeechClient({
    keyFilename: path.join(__dirname, "../speechCred.json"),
  });
};

module.exports = {
  Speech: Speech,
};
