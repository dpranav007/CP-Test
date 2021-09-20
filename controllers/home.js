const fs = require("fs-extra");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const util = require("util");

const sampleAudioPath = "audio/sample.mp3";
const audioTrackUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.resolve("uploads"));
    },
    filename(req, file, cb) {
      const extension = file.originalname.split(".").pop().toLowerCase();
      const outputFileName = `${uuidv4()}.${extension}`;
      req._fileName = outputFileName;
      cb(null, outputFileName);
    },
  }),
  fileFilter(req, file, cb) {
    if (
      file.mimetype == "audio/mpeg" &&
      file.originalname.split(".").pop().toLowerCase() === "mp3"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
}).any();
const audioTrackUploadPromise = util.promisify(audioTrackUpload);

/**
 * GET /
 * Home page.
 */
exports.getUser = async (req, res) => {
  try {
    const user = await fs.readJson("./db.json");
    if (!user.audioTrack) {
      user.audioTrack = sampleAudioPath;
      user.originalName = "sample.mp3";
    }
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

exports.uploadAudioTrack = async (req, res) => {
  try {
    await audioTrackUploadPromise(req, res);
    console.log(req.files);
    if (req.files && req.files.length == 0) {
      throw new Error("Only mp3 files supported");
    }

    const user = await fs.readJson("./db.json");
    user.audioTrack = `uploads/${req.files[0].filename}`;
    user.originalName = `${req.files[0].originalname}`;

    fs.writeJsonSync("./db.json", user);

    res.json();
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAudioTrack = async (req, res) => {
  try {
    const user = await fs.readJson("./db.json");
    user.audioTrack = "";
    user.originalName = "";

    fs.writeJsonSync("./db.json", user);

    res.json();
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};
