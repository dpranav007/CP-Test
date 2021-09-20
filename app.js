/**
 * Module dependencies.
 */
const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const logger = require("morgan");
const chalk = require("chalk");
const errorHandler = require("errorhandler");
const dotenv = require("dotenv");
const path = require("path");
const sass = require("node-sass-middleware");
const multer = require("multer");
const fs = require("fs-extra");
const cors = require("cors");

const upload = multer({ dest: path.join(__dirname, "uploads") });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env.example" });

/**
 * Controllers (route handlers).
 */
const homeController = require("./controllers/home");

const defultUser = {
  firstName: "Jane",
  lastName: "Doe",
  dob: "1995-04-01T04:30:00.000Z",
  interests: ["music", "cricket", "photography", "running", "gin & wine"],
  audioTrack: "",
  originalName: "",
};
fs.writeJsonSync("./db.json", defultUser);
/**
 * Create Express server.
 */
const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
/**
 * Express configuration.
 */
app.set("host", process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0");
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(compression());
app.use(
  sass({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
  })
);
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.path === "/api/upload") {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    next();
  } else {
    next();
  }
});
app.disable("x-powered-by");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/audio", express.static(path.join(__dirname, "audio")));

app.use("/", express.static(path.join(__dirname, "public")));
app.get("/getUser", homeController.getUser);
app.post("/uploadAudioTrack", homeController.uploadAudioTrack);
app.get("/deleteAudioTrack", homeController.deleteAudioTrack);

const indexPath = path.join(__dirname, "public", "index.html");
app.get("*", (req, res) => {
  res.sendFile(indexPath);
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Server Error");
  });
}

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(
    "%s App is running at http://localhost:%d in %s mode",
    chalk.green("✓"),
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;
