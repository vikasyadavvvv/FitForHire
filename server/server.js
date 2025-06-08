import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import resumeRoutes from "./routes/resume.js";

dotenv.config();
const app = express();

// Clerk middleware

// File upload config
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/resume", resumeRoutes);


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});