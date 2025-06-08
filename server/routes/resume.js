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

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ New universal text extractor
const extractResumeText = async (buffer, ext) => {
  if (ext === "pdf") {
    try {
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err) {
      throw new Error("PDF parsing failed");
    }
  } else if (ext === "docx") {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    } catch (err) {
      throw new Error("DOCX parsing failed");
    }
  } else {
    throw new Error("Unsupported file type");
  }
};

/* 
======================================
📍 ROUTE 1: Resume Upload + Extraction
POST /api/resume
======================================
*/
router.post("/resume", requireAuth(), async (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumeFile = req.files.resume;
    const { name: originalname, data, mimetype } = resumeFile;
    const ext = path.extname(originalname).slice(1).toLowerCase();

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${mimetype};base64,${data.toString("base64")}`,
      {
        resource_type: "raw",
        folder: "resumes",
        public_id: `${Date.now()}_${path.parse(originalname).name}`,
      }
    );

    // ✅ Extract text
    const extractedText = await extractResumeText(data, ext);

    res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalFilename: originalname,
      extractedText,
    });

  } catch (err) {
    console.error("Resume upload error:", err.message);

    if (err.message.includes("parsing failed")) {
      return res.status(400).json({
        message: "Failed to parse resume. Please upload a supported and valid PDF or DOCX file.",
      });
    }

    res.status(500).json({ message: "Resume upload failed due to server error." });
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




router.post("/generate-ats-resume", requireAuth(), async (req, res) => {
  try {
    // 1. Input Validation
    if (!req.is('application/json')) {
      return res.status(415).json({ 
        message: "Content-Type must be application/json",
        code: "INVALID_CONTENT_TYPE"
      });
    }

    // 2. Data Extraction and Validation
    const requiredFields = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      skills: req.body.skills || [],
      education: req.body.education || []
    };

    const optionalFields = {
      portfolioUrl: req.body.portfolioUrl || "",
      linkedinUrl: req.body.linkedinUrl || "",
      professionalSummary: req.body.professionalSummary || "",
      certificates: req.body.certificates || [],
      workExperience: req.body.workExperience || [],
      projects: req.body.projects || [],
      targetJobTitle: req.body.targetJobTitle || "",
      targetJobDescription: req.body.targetJobDescription || ""
    };

    // Validate required fields
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (Array.isArray(value) && value.length === 0))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: "Missing required fields",
        missingFields,
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // 3. Prepare Resume Data
    const resumeData = {
      contact: {
        name: requiredFields.name,
        email: requiredFields.email,
        phone: requiredFields.phone,
        portfolioUrl: optionalFields.portfolioUrl,
        linkedinUrl: optionalFields.linkedinUrl
      },
      summary: optionalFields.professionalSummary,
      skills: requiredFields.skills,
      education: requiredFields.education,
      experience: optionalFields.workExperience,
      projects: optionalFields.projects,
      certificates: optionalFields.certificates,
      targetJobTitle: optionalFields.targetJobTitle,
      targetJobDescription: optionalFields.targetJobDescription
    };

    // 4. Generate Prompt
    const prompt = buildResumeGenerationPrompt(resumeData);

    // 5. Call Gemini AI
    const model = getFitnessModel();
    const result = await model.generateContent(prompt);
    const rawText = await result.response.text();

    // 6. Process and Validate Response
    const generated = parseAndValidateResumeResponse(rawText);

    // 7. Merge generated summary if needed
    if (generated.generatedSummary && !optionalFields.professionalSummary) {
      resumeData.summary = generated.generatedSummary;
    }

    // 8. Success Response
    res.json({
      success: true,
      ...generated,
      finalResumeData: resumeData
    });

  } catch (error) {
    console.error("Resume Generation Error:", error);
    
    const errorResponse = {
      success: false,
      message: "Resume generation failed",
      code: "GENERATION_FAILURE"
    };
    
    if (process.env.NODE_ENV === "development") {
      errorResponse.error = error.message;
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
});

// Helper function to build the resume generation prompt
function buildResumeGenerationPrompt(resumeData) {
  return `
You are an expert ATS (Applicant Tracking System) resume consultant with 10+ years of experience.
Generate an optimized ATS-friendly resume based on the following data:

CANDIDATE INFORMATION
---------------------
Name: ${resumeData.contact.name}
Email: ${resumeData.contact.email}
Phone: ${resumeData.contact.phone}
Portfolio: ${resumeData.contact.portfolioUrl}
LinkedIn: ${resumeData.contact.linkedinUrl}

TARGET JOB
----------
Title: ${resumeData.targetJobTitle || 'Not specified'}
Description: ${resumeData.targetJobDescription || 'Not provided'}

RESUME CONTENT
--------------
Professional Summary:
${resumeData.summary || 'Not provided'}

Skills:
${resumeData.skills.join(', ')}

Education:
${resumeData.education.map(edu => `${edu.degree} at ${edu.institution} (${edu.year})`).join('\n')}

Work Experience:
${resumeData.experience.map(exp => `${exp.title} at ${exp.company} (${exp.duration})`).join('\n')}

Projects:
${resumeData.projects.map(proj => `${proj.name}: ${proj.description}`).join('\n')}

Certificates:
${resumeData.certificates.join(', ')}

CRITICAL INSTRUCTIONS:
1. Generate an ATS-optimized resume in JSON format with:
   - Perfect keyword matching for the target job
   - Quantifiable achievements
   - Proper section ordering
   - Action-oriented language

2. Provide analysis of:
   - ATS compatibility score (0-100)
   - Keyword optimization
   - Suggested improvements

3. Return ONLY JSON with this exact structure:
{
  "atsResume": {
    "contact": {
      "name": string,
      "email": string,
      "phone": string,
      "portfolioUrl": string,
      "linkedinUrl": string
    },
    "summary": string,
    "skills": string[],
    "education": {
      "institution": string,
      "degree": string,
      "year": string,
      "achievements": string[]
    }[],
    "experience": {
      "company": string,
      "title": string,
      "duration": string,
      "achievements": string[]
    }[],
    "projects": {
      "name": string,
      "description": string,
      "technologies": string[]
    }[],
    "certificates": string[]
  },
  "analysis": {
    "atsScore": number,
    "keywordMatch": {
      "matchedKeywords": string[],
      "missingKeywords": string[]
    },
    "improvementSuggestions": string[],
    "generatedSummary": string
  }
}
`.trim();
}

// Helper function to parse and validate the resume response
function parseAndValidateResumeResponse(rawText) {
  const jsonStart = Math.max(rawText.indexOf('{'), 0);
  const jsonEnd = Math.min(rawText.lastIndexOf('}') + 1, rawText.length);
  
  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error("No JSON found in AI response");
  }

  let generated;
  try {
    generated = JSON.parse(rawText.slice(jsonStart, jsonEnd));
  } catch (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }

  // Validate required structure
  const requiredStructure = {
    atsResume: {
      contact: {
        name: "string",
        email: "string",
        phone: "string"
      },
      summary: "string",
      skills: "array",
      education: "array",
      experience: "array"
    },
    analysis: {
      atsScore: "number",
      keywordMatch: {
        matchedKeywords: "array",
        missingKeywords: "array"
      },
      improvementSuggestions: "array"
    }
  };

  function validateStructure(obj, structure) {
    for (const [key, type] of Object.entries(structure)) {
      if (!obj.hasOwnProperty(key)) {
        throw new Error(`Missing required field: ${key}`);
      }
      
      if (typeof type === 'object') {
        validateStructure(obj[key], type);
      } else if (typeof obj[key] !== type) {
        throw new Error(`Invalid type for ${key}, expected ${type}`);
      }
    }
  }

  validateStructure(generated, requiredStructure);

  return generated;
}
export default router;