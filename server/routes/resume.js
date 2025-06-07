import express from "express";
import { requireAuth } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import mammoth from "mammoth";
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
  secure: true,
});

const FILE_TYPE_VALIDATOR = {
  pdf: {
    validate: async (buffer) => {
      try {
        const { text } = await pdfParse(buffer);
        return text && text.trim().length >= 50;
      } catch {
        return false;
      }
    },
  },
  docx: {
    validate: async (buffer) => {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        return value && value.trim().length >= 50;
      } catch {
        return false;
      }
    },
  },
};

const processResumeFile = async (fileBuffer, fileType) => {
  const MIN_TEXT_LENGTH = 50;

  if (fileType === "pdf") {
    const { text } = await pdfParse(fileBuffer);
    if (!text || text.trim().length < MIN_TEXT_LENGTH)
      throw new Error("PDF unreadable");
    return {
      text,
      truncatedText: text.substring(0, 1000) + (text.length > 1000 ? "..." : ""),
    };
  }

  if (fileType === "docx") {
    const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
    if (!value || value.trim().length < MIN_TEXT_LENGTH)
      throw new Error("DOCX unreadable");
    return {
      text: value,
      truncatedText: value.substring(0, 1000) + (value.length > 1000 ? "..." : ""),
    };
  }

  throw new Error("Unsupported file format");
};

async function cleanup() {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix("resumes/");
    console.log("Cleanup complete:", result);
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
}
// Uncomment to run cleanup on server start (use cautiously)
// cleanup();

router.post("/resume", requireAuth(), express.json({ limit: "15mb" }), async (req, res) => {
  try {
    // Expecting JSON body with these keys from frontend:
    // { fileBase64: "data:application/pdf;base64,....", fileName: "resume.pdf", fileType: "pdf" }
    const { fileBase64, fileName, fileType } = req.body;

    if (!fileBase64 || !fileName || !fileType) {
      return res.status(400).json({ code: "NO_FILE", message: "Missing file data" });
    }

    // Validate file type supported
    if (!["pdf", "docx"].includes(fileType.toLowerCase())) {
      return res.status(400).json({ code: "UNSUPPORTED_TYPE", message: "Unsupported file type" });
    }

    // Extract base64 string from data URI
    const matches = fileBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ code: "INVALID_BASE64", message: "Invalid base64 string" });
    }
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file content by parsing
    const isValid = await FILE_TYPE_VALIDATOR[fileType.toLowerCase()].validate(buffer);
    if (!isValid) {
      return res.status(400).json({ code: "INVALID_CONTENT", message: "Unreadable or empty file" });
    }

    // Upload to Cloudinary using upload_stream
    const public_id = `user_${req.user.id}_${Date.now()}`;
    const cloudRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "resumes",
          public_id,
          resource_type: "raw",
          tags: ["temp_resumes"],
          context: `user_id=${req.user.id}|filename=${fileName}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });

    // Extract text content for response
    const { text, truncatedText } = await processResumeFile(buffer, fileType.toLowerCase());

    res.status(200).json({
      success: true,
      fileInfo: {
        originalName: fileName,
        fileType,
        size: buffer.length,
      },
      content: {
        sample: truncatedText,
        fullLength: text.length,
        wordCount: text.split(/\s+/).length,
      },
      storage: {
        url: cloudRes.secure_url,
        publicId: cloudRes.public_id,
        bytesStored: cloudRes.bytes,
      },
      timestamps: {
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error("Upload processing error:", error);

    let status = 500;
    let code = "PROCESSING_ERROR";

    if (error.message.includes("quota")) {
      status = 507;
      code = "STORAGE_QUOTA_FULL";
    } else if (error.message.includes("unreadable")) {
      status = 400;
      code = "INVALID_CONTENT";
    } else if (error.message.includes("Unsupported")) {
      status = 400;
      code = "UNSUPPORTED_TYPE";
    } else if (error.message.includes("base64")) {
      status = 400;
      code = "INVALID_BASE64";
    }

    res.status(status).json({ code, message: error.message });
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
