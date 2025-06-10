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


router.post("/generate-resume",  async (req, res) => {
  // 1) Validate mandatory fields
  const {
    jobPosition,
    // ↑ Mandatory fields
    Fullname,
    Address,
    email,
    phone,
    education,
    skills,
    // ↓ Optional fields
    workExperience = [],
    projects = [],
    portfolioUrl = "",
    linkedinUrl = "",
    certifications = [],
    languages = [],
    achievements = []
  } = req.body;

  // Basic validation
  if (!jobPosition || !Fullname || !Address || !email || !phone || !education || !skills) {
    return res.status(400).json({
      message: "Missing required fields: jobPosition,  Fullname, email, phone, education, and skills are mandatory"
    });
  }

  // 2) Prepare the prompt for Gemini
  const prompt = `
You are a professional resume builder with expertise in ATS optimization. 
Create a comprehensive resume based on the following details:

JOB POSITION: ${jobPosition}

CANDIDATE DETAILS:
 -Fullname:${Fullname}
 -Address:${Address}
- Email: ${email}
- Phone: ${phone}
- Education: ${education}
- Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}

OPTIONAL SECTIONS:
${workExperience.length > 0 ? `WORK EXPERIENCE:\n${workExperience.map(exp => 
  `• ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description || ''}`
).join('\n')}\n` : ''}
${projects.length > 0 ? `PROJECTS:\n${projects.map(proj => 
  `• ${proj.title}: ${proj.description || ''} ${proj.technologies ? `(Technologies: ${proj.technologies})` : ''}`
).join('\n')}\n` : ''}
${certifications.length > 0 ? `CERTIFICATIONS: ${certifications.join(', ')}\n` : ''}
${languages.length > 0 ? `LANGUAGES: ${languages.join(', ')}\n` : ''}
${achievements.length > 0 ? `ACHIEVEMENTS:\n${achievements.join('\n• ')}\n` : ''}
${portfolioUrl ? `PORTFOLIO: ${portfolioUrl}\n` : ''}
${linkedinUrl ? `LINKEDIN: ${linkedinUrl}\n` : ''}

INSTRUCTIONS:
1. Generate a professional summary (3-4 lines) highlighting the candidate's qualifications for ${jobPosition}
2. Structure the resume in ATS-friendly format with these sections:
   - Professional Summary
   - Skills (group related skills together)
   - Education
   - ${workExperience.length > 0 ? 'Work Experience' : ''}
   - ${projects.length > 0 ? 'Projects' : ''}
   - ${certifications.length > 0 ? 'Certifications' : ''}
   - ${languages.length > 0 ? 'Languages' : ''}
   - ${achievements.length > 0 ? 'Achievements' : ''}
   - Contact Information

3. ATS Optimization:
   - Include relevant keywords from the job position
   - Use bullet points for readability
   - Quantify achievements where possible
   - Use standard section headings
   - Avoid graphics/tables

4. For work experience:
   - Start bullet points with action verbs
   - Focus on accomplishments rather than duties
   - Include metrics when possible

Return ONLY JSON with this exact structure:
{
  "professionalSummary": string,
  "resumeSections": [
    {
      "sectionName": string,
      "content": string[] | string  // array for bullet points, string for paragraphs
    },
    ...
  ],
  "atsOptimizationTips": string[],  // specific tips for this resume
  "keywords": string[]              // important keywords to include
}
`.trim();

  try {
    // Call Gemini
    const model = getFitnessModel();
    const result = await model.generateContent(prompt);
    const rawText = await result.response.text();

    // Extract JSON response
    const jsonStart = rawText.indexOf("{");
    const jsonEnd = rawText.lastIndexOf("}") + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON found in response");

    const generatedResume = JSON.parse(rawText.slice(jsonStart, jsonEnd));

    // Validate structure
    if (!generatedResume.professionalSummary || 
        !Array.isArray(generatedResume.resumeSections)) {
      throw new Error("Invalid resume structure from AI");
    }

    // Add user's original data for reference
    generatedResume.meta = {
      jobPosition,
      timestamp: new Date().toISOString()
    };

    res.json(generatedResume);

  } catch (error) {
    console.error("❌ Resume Generation Error:", error);
    res.status(500).json({
      message: "Resume generation failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;

