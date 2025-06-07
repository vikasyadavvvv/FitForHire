import express from "express";
import { requireAuth } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import mammoth from "mammoth";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import dotenv from "dotenv";
import { getFitnessModel } from "../config/geminiConfig.js";
import { calcATSScore, detectATSIssues } from "../utils/atsDetector.js";

dotenv.config();               // ⬅️  load .env first




const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Enforce HTTPS
  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET // Optional but recommended
});

// Enhanced text extractor with better error handling
const extractResumeText = async (buffer, ext) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("File too large (max 5MB)");
  }

  try {
    if (ext === "pdf") {
      const data = await pdfParse(buffer);
      if (!data.text || data.text.trim().length < 50) { // Minimum 50 chars
        throw new Error("PDF appears to be empty or unreadable");
      }
      return data.text;
    } else if (ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      if (!value || value.trim().length < 50) {
        throw new Error("DOCX appears to be empty or unreadable");
      }
      return value;
    }
    throw new Error("Unsupported file type");
  } catch (err) {
    console.error(`Text extraction error (${ext}):`, err.message);
    throw err; // Re-throw with original error
  }
};

// Supported file types
const SUPPORTED_MIMETYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

router.post("/resume", requireAuth(), async (req, res) => {
  try {
    // 1. Validate file exists
    if (!req.files?.resume) {
      return res.status(400).json({ 
        message: "No file uploaded",
        supported_formats: Object.keys(SUPPORTED_MIMETYPES)
      });
    }

    const { name: originalname, data, mimetype, size } = req.files.resume;

    // 2. Validate file type
    const ext = SUPPORTED_MIMETYPES[mimetype];
    if (!ext) {
      return res.status(400).json({
        message: "Unsupported file type",
        supported_types: Object.keys(SUPPORTED_MIMETYPES)
      });
    }

    // 3. Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({
        message: `File too large (max ${MAX_SIZE/1024/1024}MB)`,
        actual_size: `${(size/1024/1024).toFixed(2)}MB`
      });
    }

    // 4. Upload to Cloudinary with error handling
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(
        `data:${mimetype};base64,${data.toString("base64")}`,
        {
          resource_type: "raw",
          folder: "resumes",
          public_id: `${Date.now()}_${path.parse(originalname).name}`,
          upload_preset: "resumes_preset", // Recommended for better control
          quality_analysis: true // Optional: get quality metrics
        }
      );
    } catch (cloudinaryErr) {
      console.error("Cloudinary upload failed:", cloudinaryErr.message);
      throw new Error("File storage service unavailable");
    }

    // 5. Extract text with validation
    const extractedText = await extractResumeText(data, ext);

    // 6. Success response
    res.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalFilename: originalname,
      extractedText: extractedText.substring(0, 1000) + "...", // Sample text
      fullTextLength: extractedText.length,
      uploadInfo: {
        bytes: uploadResult.bytes,
        format: uploadResult.format,
        created_at: uploadResult.created_at
      }
    });

  } catch (err) {
    console.error("Resume upload error:", err);

    // Specific error responses
    if (err.message.includes("Unsupported") || err.message.includes("Failed to parse")) {
      return res.status(400).json({
        message: err.message,
        supported_types: ["PDF", "DOCX"]
      });
    }

    if (err.message.includes("too large")) {
      return res.status(413).json({ 
        message: err.message,
        max_size: "5MB"
      });
    }

    // Generic server error
    res.status(500).json({ 
      message: "Resume processing failed",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 📍 ROUTE 2: Resume + JD Analysis (AI)
//     POST /api/resume/analyze
// ─────────────────────────────────────────────────────────────
router.post("/analyze", requireAuth(), async (req, res) => {
  let { resumeText = "", jobDescription = "" } = req.body;

  // 1) Basic validation + length cap
  resumeText     = resumeText.trim().slice(0, 4000);       // Increased limit for more detail
  jobDescription = jobDescription.trim().slice(0, 4000);
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const atsWarnings = detectATSIssues(resumeText);
  const atsScore    = calcATSScore(atsWarnings);

  // 2) Extended prompt for detailed analysis
  const prompt = `
You are a senior career advisor with 15+ years of technical recruiting experience.
Analyze the resume against the job description in detail.

RESUME CONTENT
--------------
${resumeText}

JOB DESCRIPTION
---------------
${jobDescription}

CRITICAL INSTRUCTIONS:
1. Provide an overall match score from 0-100 based on:
   • Skill alignment 40%
   • Experience 30%
   • Education 20%
   • Cultural fit 10%

2. Detailed Skill Gap Analysis:
   - Categorize 3 missing hard skills by importance (critical, nice-to-have).
   - For each missing skill, suggest links to resources or tutorials.
   - Suggest certifications or courses related to missing skills.

3. Experience Match Breakdown:
   - Break down years of experience relevant to each key skill/job responsibility.
   - Highlight transferable skills if exact matches are missing.

4. Education & Certification Alignment:
   - Analyze how well education and certifications match the job.
   - Suggest additional certifications or training to improve alignment.

5. Resume Formatting & ATS Tips:
   - Analyze resume formatting for ATS compatibility.
   - Suggest improvements such as keyword density, section ordering, font style.

6. Soft Skills and Cultural Fit Suggestions:
   - Identify soft skills mentioned in the resume that align with job culture.
   - Suggest soft skills to emphasize based on the job role and culture.

7. Actionable Summary & Next Steps:
   - Provide a brief summary highlighting strengths.
   - List top 3 prioritized action items for improvement.

8. Example Phrases & Bullet Points:
   - Provide sample bullet points/phrases to include based on missing or weak areas.
   - Help quantify achievements (e.g., "Increased engagement by 30%...").

9. Job Description Keywords Highlight:
   - Extract keywords from the job description that should be in the resume.
   - Identify keywords currently missing.

10. Interview Preparation Tips:
    - Suggest common interview questions based on missing skills or improvement areas.
    - Recommend mock interview resources or practice exercises.

11. If available, provide comparison with typical top candidates for this role.

Return ONLY JSON with the exact following structure (no extra text):

{
  "score": number,
  "skillGapAnalysis": [
    {
      "skill": string,
      "importance": "critical" | "nice-to-have",
      "resourceLinks": string[],
      "recommendedCertifications": string[]
    },
    ... 3 items total
  ],
  "experienceMatch": [
    {
      "skillOrResponsibility": string,
      "yearsExperience": number,
      "transferableSkill": boolean,
      "notes": string
    },
    ...
  ],
  "educationAndCertifications": {
    "matchAnalysis": string,
    "suggestedCertifications": string[]
  },
  "resumeFormattingTips": string,
  "softSkillsCulturalFit": {
    "matchedSoftSkills": string[],
    "suggestedSoftSkills": string[]
  },
  "actionableSummary": {
    "strengths": string[],
    "topActions": string[]
  },
  "exampleBulletPoints": string[],
  "jobDescriptionKeywords": {
    "requiredKeywords": string[],
    "missingKeywords": string[]
  },
  "interviewPrepTips": {
    "commonQuestions": string[],
    "recommendedResources": string[]
  },
  "candidateComparison": string
}
   ↳ keep everything you already had …

    12. Return the **same JSON** but add a new top-level key "ats" exactly like:
        "ats": {
          "score": ${atsScore},                // already pre-computed
          "warnings": ${JSON.stringify(atsWarnings)}
        }

    Do NOT change keys or add commentary outside JSON.
`.trim();

  try {
    /* ──────── Gemini call ──────── */
    const model   = getFitnessModel();            // your memoised helper
    const result  = await model.generateContent(prompt);
    const rawText = await result.response.text(); // ⬅️ MUST await

    /* ──────── Robust JSON extraction ──────── */
    const jsonStart = rawText.indexOf("{");
    const jsonEnd   = rawText.lastIndexOf("}") + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON found");

    const analysis = JSON.parse(rawText.slice(jsonStart, jsonEnd));
     analysis.ats = { score: atsScore, warnings: atsWarnings };

    /* ──────── Validate structure ──────── */
    const ok =
      typeof analysis.score === "number" &&
      Array.isArray(analysis.skillGapAnalysis) &&
      Array.isArray(analysis.experienceMatch) &&
      typeof analysis.educationAndCertifications === "object" &&
      typeof analysis.resumeFormattingTips === "string" &&
      typeof analysis.softSkillsCulturalFit === "object" &&
      typeof analysis.actionableSummary === "object" &&
      Array.isArray(analysis.exampleBulletPoints) &&
      typeof analysis.jobDescriptionKeywords === "object" &&
      typeof analysis.interviewPrepTips === "object" &&
      typeof analysis.candidateComparison === "string";

    if (!ok) throw new Error("Invalid response structure from AI");

    res.json(analysis);
  } catch (error) {
    console.error("❌ Career Analysis Error:", error);
    res.status(500).json({
      message: "Analysis failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
