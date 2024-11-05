import express from "express";
import cron from "node-cron";
import cors from "cors";
import dotenv from "dotenv";

import tasksRoutes from "./routes/tasks.js";
import { startCrawler as euroclearCrawler } from "./crawlers/euroclear/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: "https://topwomen.careers",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/crawlers", tasksRoutes);

// app.get("/crawlers/test", (req, res) => {
//   if (!tasks["test"]) {
//     tasks["test"] = cron.schedule("0 10 * * *", testCrawler, {
//       timezone: "Europe/Brussels",
//     });
//     const currentTime = new Date().toLocaleString("en-US", {
//       timezone: "Europe/Brussels",
//     });
//     console.log(`Task started at ${currentTime} (Brussels time)`);
//     console.log("Cron task for test scheduled");
//     return res.status(200).json({
//       status: "success",
//       message: "Cron task for test scheduled",
//     });
//   } else {
//     return res.status(400).json({
//       status: "error",
//       message: "Cron task for test is already scheduled",
//     });
//   }
// });

// app.delete("/crawlers/test", (req, res) => {
//   if (tasks["test"]) {
//     tasks["test"].stop();
//     delete tasks["test"];
//     console.log("Cron task for test removed");
//     return res.status(200).json({
//       status: "success",
//       message: "Cron task for test removed",
//     });
//   } else {
//     return res.status(400).json({
//       status: "error",
//       message: "No cron task for test to remove",
//     });
//   }
// });

// app.get("/crawlers/euroclear", (req, res) => {
//   if (!tasks["euroclear"]) {
//     tasks["euroclear"] = cron.schedule("0 7,18 * * *", euroclearCrawler, {
//       timezone: "Europe/Brussels",
//     });
//     console.log("Cron task for euroclear scheduled");
//     return res.status(200).json({
//       status: "success",
//       message: "Cron task for euroclear scheduled",
//     });
//   } else {
//     return res.status(400).json({
//       status: "error",
//       message: "Cron task for euroclear is already scheduled",
//     });
//   }
// });

// app.delete("/crawlers/euroclear", (req, res) => {
//   if (tasks["euroclear"]) {
//     tasks["euroclear"].stop();
//     delete tasks["euroclear"];
//     console.log("Cron task for euroclear removed");
//     return res.status(200).json({
//       status: "success",
//       message: "Cron task for euroclear removed",
//     });
//   } else {
//     return res.status(400).json({
//       status: "error",
//       message: "No cron task for euroclear to remove",
//     });
//   }
// });

// app.use((req, res) => {
//   res.status(404).json({
//     status: "error",
//     message: "Route not found",
//   });
// });

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} started`);
});
