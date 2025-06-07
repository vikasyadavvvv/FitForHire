import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import resumeRoutes from "./routes/resume.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
const app = express();

/* -------------------------------------------------------------------------- */
/*                                Cloudinary                                  */
/* -------------------------------------------------------------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* -------------------------------------------------------------------------- */
/*                                    CORS                                    */
/* -------------------------------------------------------------------------- */
const whitelist = [
  "http://localhost:5173",
  "https://fit-for-hire-livid.vercel.app",
  /^https:\/\/fit-for-hire-livid.*\.vercel\.app$/, // Vercel previews
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin (like curl/postman)
    const isAllowed = whitelist.some(entry =>
      entry instanceof RegExp ? entry.test(origin) : entry === origin
    );
    if (isAllowed) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: (req, cb) => cb(null, req.headers["access-control-request-headers"] || ""),
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

/* -------------------------------------------------------------------------- */
/*                            Body‑parser limits                              */
/* -------------------------------------------------------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* -------------------------------------------------------------------------- */
/*                             MongoDB connect                                */
/* -------------------------------------------------------------------------- */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection error ❌", err.message);
    process.exit(1);
  }
};
connectDB();

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */
app.use("/api/resume", resumeRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK", time: new Date() });
});

/* -------------------------------------------------------------------------- */
/*                             404 + Error handler                            */
/* -------------------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

/* -------------------------------------------------------------------------- */
/*                                 Start‑up                                   */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("CORS whitelist:", whitelist.map(w => w.toString()).join(", "));
});
