const express = require("express");
const cron = require("node-cron");
const cors = require("cors");

const { trackMixpanel } = require("./mixpanel")

const { startCrawler: euroclearCrawler } = require("./crawlers/euroclear/index");
const { startCrawler: testCrawler } = require("./crawlers/test/index");
const { startCrawler: testCrawler2 } = require("./crawlers/test2/index");

const tasks = {};
const PORT = 3000;

const app = express();

const corsOptions = {
  origin: "https://topwomen.careers",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));

app.get("/crawlers/test2", (req, res) => {
  if (!tasks["test2"]) {
    tasks["test2"] = cron.schedule("*/10 * * * *", testCrawler2);
    console.log("Cron task for test2 scheduled");
    return res.status(200).json({
      status: "success",
      message: "Cron task for test2 scheduled",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "Cron task for test2 is already scheduled",
    });
  }
});

app.delete("/crawlers/test2", (req, res) => {
  if (tasks["test2"]) {
    tasks["test2"].stop();
    delete tasks["test2"];
    console.log("Cron task for test2 removed");
    return res.status(200).json({
      status: "success",
      message: "Cron task for test2 removed",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "No cron task for test2 to remove",
    });
  }
});

app.get("/crawlers/test", (req, res) => {
  if (!tasks["test"]) {
    tasks["test"] = cron.schedule("*/10 * * * *", testCrawler);
    console.log("Cron task for test scheduled");
    return res.status(200).json({
      status: "success",
      message: "Cron task for test scheduled",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "Cron task for test is already scheduled",
    });
  }
});

app.delete("/crawlers/test", (req, res) => {
  if (tasks["test"]) {
    tasks["test"].stop();
    delete tasks["test"];
    console.log("Cron task for test removed");
    return res.status(200).json({
      status: "success",
      message: "Cron task for test removed",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "No cron task for test to remove",
    });
  }
});

app.get("/crawlers/euroclear", (req, res) => {
  if (!tasks["euroclear"]) {
    tasks["euroclear"] = cron.schedule("*/10 * * * *", euroclearCrawler);
    console.log("Cron task for euroclear scheduled");
    return res.status(200).json({
      status: "success",
      message: "Cron task for euroclear scheduled",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "Cron task for euroclear is already scheduled",
    });
  }
});

app.delete("/crawlers/euroclear", (req, res) => {
  if (tasks["euroclear"]) {
    tasks["euroclear"].stop();
    delete tasks["euroclear"];
    console.log("Cron task for euroclear removed");
    return res.status(200).json({
      status: "success",
      message: "Cron task for euroclear removed",
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: "No cron task for euroclear to remove",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} started`);
});
