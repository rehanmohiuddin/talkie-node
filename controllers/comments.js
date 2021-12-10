const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const { v4: uuid } = require("uuid");
const { bucket } = require("../config/storage");
const { format } = require("util");

const postComment = (req, res) => {
  try {
    const db = getFirestore();
    const comment_id = uuid();
    const docRef = db.collection("comments").doc(comment_id);
    const { uid, recording_id, time_at, type, content } = req.body;
    const _newComment = {
      recording_id: recording_id,
      uid: uid,
      timestamp: new Date().toISOString(),
      type: type,
      content: content,
      edited: false,
      mentions: [],
      replies: [],
      _id: comment_id,
      time_at: time_at,
    };
    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      blobStream.on("error", (err) => {
        res.status(500).send({ message: err.message });
      });

      blobStream.on("finish", async (data) => {
        // Create URL for directly file access via HTTP.
        // await bucket.file(req.file.originalname).makePublic();
        const url = format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        const commentWithFile = {
          ..._newComment,
          url: url,
          fileType: req.file.mimetype.split("/")[0],
        };

        docRef.set(commentWithFile).then(() => {
          return res.status(200).json({
            createRecordingComment: commentWithFile,
          });
        });
      });

      blobStream.end(req.file.buffer);
    } else {
      docRef.set(_newComment).then(() => {
        return res.status(200).json({
          createRecordingComment: _newComment,
        });
      });
    }
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
};

const getComments = async (req, res) => {
  const db = getFirestore();
  const respComments = [];
  const commentsRef = db.collection("comments");
  const { recording_id } = req.query;
  const Comments = [];
  const CommentsRef = await commentsRef
    .where("recording_id", "==", recording_id)
    .get();
  CommentsRef.forEach((doc) => {
    Comments.push(doc.data());
  });
  const _getComments = new Promise((resolve, reject) => {
    Comments.forEach(async (_comment, index) => {
      const replies = [];
      const _replies = _comment.replies;
      if (_replies) {
        _replies.forEach(async (reply, Rindex) => {
          const replyDoc = await reply.get();
          replies.push(replyDoc.data());
          if (_replies.length === replies.length) {
            resolve();
          }
        });
        respComments.push({ ..._comment, replies: replies });
      } else respComments.push({ ..._comment });
    });
  });
  _getComments
    .then((_comnts) => {
      return res.status(200).json({
        comments: respComments,
      });
    })
    .catch(() => {
      return res.status(500).json({
        error: "Something Went Wrong...",
      });
    });
};

const replyToComment = async (req, res) => {
  try {
    const { uid, toComment_id, type, content, recording_id } = req.body;
    const db = getFirestore();
    const comment_id = uuid();
    const docRef = db.collection("comments").doc(comment_id);
    const _newComment = {
      recording_id: recording_id,
      uid: uid,
      timestamp: new Date().toISOString(),
      type: type,
      content: content,
      edited: false,
      mentions: [],
      _id: comment_id,
      parent_comment_id: toComment_id,
    };
    await docRef.set(_newComment);
    const commentRefrence = await db
      .collection("comments")
      .doc(toComment_id)
      .get();
    const comment = await commentRefrence.data();
    await db
      .collection("comments")
      .doc(toComment_id)
      .update({
        replies: [db.doc("comments/" + comment_id), ...comment.replies],
      });
    return res.status(200).json({
      repliedComment: _newComment,
    });
  } catch (error) {
    return res.status(200).json({
      error: error.toString(),
    });
  }
};

module.exports = {
  postComment: postComment,
  getComments: getComments,
  replyToComment: replyToComment,
};
