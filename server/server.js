import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import resumeRoutes from "./routes/resume.js";
import fileUpload from "express-fileupload";


dotenv.config();
const app = express();

app.use(
  fileUpload({
    useTempFiles: false,            // keep file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max – adjust as required
  })
);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"));

app.use("/api/resume", resumeRoutes);

app.listen(process.env.PORT, () => console.log("Server running"));