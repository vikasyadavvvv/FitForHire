import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import resumeRoutes from "./routes/resume.js";

dotenv.config();
const app = express();


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://fit-for-hire-livid.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://fit-for-hire-livid.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// File upload config
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);


app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/resume", resumeRoutes);


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
// Add this to your server.js/app.js


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server-side route


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});