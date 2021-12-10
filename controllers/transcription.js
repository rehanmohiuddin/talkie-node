const { format } = require("util");
const path = require("path");

const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const { default: ShortUniqueId } = require("short-unique-id");

const { bucket } = require("../config/storage");
const { Speech } = require("../config/speech");
const { initializeFB } = require("../config/firebase");

initializeFB();

const getTranscript = async (fileName, uid) => {
  const db = getFirestore();
  const docRef = db.collection("recordings").doc(uid);
  const client = Speech();
  const config = {
    encoding: "ENCODING_UNSPECIFIED",
    sampleRateHertz: 16000,
    languageCode: "en-US",
  };

  const audio = {
    uri: `gs://talkie/${fileName}`,
  };

  const request = {
    config: config,
    audio: audio,
  };

  const [operation] = await client.longRunningRecognize(request);
  // Get a Promise representation of the final result of the job
  const [response] = await operation.promise();
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");
  console.log(`Transcription: ${transcription}`);
  await docRef.update({
    transcription: transcription,
  });
  return transcription;
};

const upload = async (req, res) => {
  const uid = new ShortUniqueId({ length: 10 })();
  const db = getFirestore();
  const docRef = db.collection("recordings").doc(uid);
  try {
    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on("error", (err) => {
      res.status(500).send({ message: err.message });
    });

    blobStream.on("finish", async (data) => {
      // Create URL for directly file access via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      try {
        // Make the file public
        await bucket.file(req.file.originalname).makePublic();
      } catch {
        console.log(
          `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`
        );
      }
      await docRef.set({
        _id: uid,
        name: uid,
        timestamp: new Date().toISOString(),
        type: req.file.mimetype.split("/")[0],
        uid: req.query.uid,
        url: publicUrl,
      });
      await getTranscript(req.file.originalname, uid);
      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

const getListFiles = async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
      });
    });

    res.status(200).send(fileInfos);
  } catch (err) {
    console.log(err);

    res.status(500).send({
      message: "Unable to read list of files!",
    });
  }
};

const download = async (req, res) => {
  try {
    const [metaData] = await bucket.file(req.params.name).getMetadata();
    res.redirect(metaData.mediaLink);
  } catch (err) {
    res.status(500).send({
      message: "Could not download the file. " + err,
    });
  }
};

module.exports = {
  uploadToGS: upload,
  getFiles: getListFiles,
  download: download,
};
