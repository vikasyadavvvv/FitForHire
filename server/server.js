import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import resumeRoutes from "./routes/resume.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
const app = express();

// Add graceful shutdown handlers
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* -------------------------------------------------------------------------- */
/*                                Cloudinary                                  */
/* -------------------------------------------------------------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/* -------------------------------------------------------------------------- */
/*                                    CORS                                    */
/* -------------------------------------------------------------------------- */
const whitelist = [
  "http://localhost:5173",
  "https://fit-for-hire-livid.vercel.app",
  /^https:\/\/fit-for-hire-livid.*\.vercel\.app$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.some(entry => 
      entry instanceof RegExp ? entry.test(origin) : entry === origin
    )) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* -------------------------------------------------------------------------- */
/*                            Enhanced Body Parsing                           */
/* -------------------------------------------------------------------------- */
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb",
  parameterLimit: 10000
}));

/* -------------------------------------------------------------------------- */
/*                             MongoDB Connection                             */
/* -------------------------------------------------------------------------- */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    });
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection error ❌", err.message);
    process.exit(1);
  }
};

await connectDB();

/* -------------------------------------------------------------------------- */
/*                            Request Logging Middleware                       */
/* -------------------------------------------------------------------------- */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */
// Add route parameter validation
app.use((req, res, next) => {
  if (req.path.includes('::') || req.path.match(/:\/[^/]/)) {
    console.error('Invalid route path detected:', req.path);
    return res.status(400).json({ error: 'Invalid URL structure' });
  }
  next();
});

app.use("/api/resume", resumeRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ 
    status: "OK", 
    time: new Date(),
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState 
  });
});

/* -------------------------------------------------------------------------- */
/*                            Enhanced Error Handling                         */
/* -------------------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ 
    error: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'POST /api/resume',
      'POST /api/resume/analyze',
      'GET /api/health'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/* -------------------------------------------------------------------------- */
/*                                 Server Start                               */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("CORS whitelist:", whitelist.map(w => w.toString()).join(", "));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

