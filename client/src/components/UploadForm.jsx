import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  IdentificationIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: CheckCircleIcon,
    title: "Skill gap analysis",
    description: "Identifies missing or weak skills compared to job requirements."
  },
  {
    icon: UserGroupIcon,
    title: "Experience alignment insights",
    description: "Analyzes how your past experience matches the job role."
  },
  {
    icon: AcademicCapIcon,
    title: "Education and certification review",
    description: "Reviews relevant educational background and certificates."
  },
  {
    icon: DocumentTextIcon,
    title: "Resume formatting suggestions",
    description: "Improves layout and ATS-friendliness of your resume."
  },
  {
    icon: LightBulbIcon,
    title: "Soft skills and cultural fit evaluation",
    description: "Evaluates soft skills and how you fit company culture."
  },
  {
    icon: ClipboardDocumentListIcon,
    title: "Personalized improvement suggestions",
    description: "Actionable tips to strengthen your resume content."
  },
  {
    icon: IdentificationIcon,
    title: "Bullet point enhancements",
    description: "Refines bullet points for clarity and impact."
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Interview preparation tips",
    description: "Prepares you with common questions and best answers."
  },
  {
    icon: UsersIcon,
    title: "Candidate comparison overview",
    description: "Benchmarks you against other top candidates."
  }
];


export default function UploadForm() {
  const navigate = useNavigate(); // ✅ Hook call
  const { getToken } = useAuth();
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);


  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMsg("");

  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("resume", file);

    const res = await fetch("https://fitforhire-production.up.railway.app/api/resume/resume", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();
    setMsg("✅ Resume uploaded successfully!");

    // Pass resume text in navigation state
    navigate('/analyze', { state: { resumeText: data.extractedText } });

  } catch (err) {
    console.error(err);
    setMsg("❌ Upload failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
      <div className="min-h-screen bg-black px-4 py-10 flex flex-col items-center justify-center text-white">
  {/* Main heading and intro */}
  <motion.div
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="text-center max-w-3xl mb-10"
  >
    <h2 className="text-4xl font-bold mb-4">Wondering if your resume stands out?</h2>
    <p className="text-gray-300 text-lg mb-3">
Try our free and fast <span className="text-blue-800 font-semibold">AI-powered</span> resume checker. It analyzes your resume across multiple key areas to ensure it's optimized to catch recruiters’ attention.    </p>
    <p className="text-gray-400 text-sm">
      Supports PDF & DOCX files only, max size 4MB. Your data privacy is fully protected.
    </p>
  </motion.div>

  {/* Phrase outside card */}


  {/* Upload Form Card */}
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="w-full max-w-md p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700"
  >
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="text-3xl font-extrabold text-white text-center mb-2 tracking-wide"
    >
      FitForHire<span className="text-blue-500 text-3xl">✓</span>

    </motion.h1>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="text-sm text-gray-300 text-center mb-6"
    >
      Drag and drop your resume or select a file to get started. 📄
    </motion.p>

    <form onSubmit={handleSubmit} className="space-y-5">
      <motion.input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full p-3 text-sm bg-gray-900/50 placeholder-gray-500 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
      />

      <motion.button
        type="submit"
        disabled={loading || !file}
        className="w-full py-3 px-4 text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 transition"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? "Uploading..." : "Upload Your Resume"}
      </motion.button>

      {msg && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-center text-gray-400"
        >
          {msg}
        </motion.p>
      )}
    </form>
  </motion.div>
      <div className="flex justify-center mt-10 px-4">
    <div
  className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 sm:p-10 text-center border border-gray-700
    transform transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:brightness-110
    overflow-visible
    before:absolute before:inset-0 before:bg-gradient-radial before:from-blue-900 before:via-transparent before:to-transparent before:opacity-20"
  style={{ backgroundImage: `radial-gradient(circle at center, rgba(59,130,246,0.15), transparent 70%)` }}
>

        <p className="text-white text-lg font-semibold leading-relaxed mb-6">
          Our AI-powered resume checker, powered by{" "}
          <span className="text-blue-400">Gemini</span>, optimizes your resume
          for the role you're targeting.
        </p>

        <div className="space-y-4 text-left text-white text-base font-medium mb-8">
          {features.map(({ icon: Icon, title, description }, idx) => (
           <div
  key={idx}
  className="flex items-center space-x-3 relative group cursor-pointer"
  onMouseEnter={() => setTooltip(idx)}
  onMouseLeave={() => setTooltip(null)}
>
  <Icon
    className="w-6 h-6 text-blue-400 flex-shrink-0 transition-transform-colors duration-300 group-hover:scale-110 group-hover:text-blue-500"
    aria-hidden="true"
  />
  <span>{title}</span>

 {tooltip === idx && (
  <div
    role="tooltip"
    className={`
      absolute sm:right-full sm:mr-3 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0
      left-0 sm:left-auto
      mt-2 sm:mt-0
      w-[90%] sm:w-64
      bg-gray-800 text-sm text-gray-300 rounded-md p-3 shadow-lg z-50
    `}
  >
    {/* Optional Arrow (only on sm and above) */}
    <div
      className="hidden sm:block absolute top-1/2 -right-2 w-3 h-3 bg-gray-800 rotate-45 -translate-y-1/2"
      aria-hidden="true"
    />
    {description}
  </div>
)}

</div>

          ))}
        </div>

        {/* Example Match Score Progress Bar */}
        <div className="mt-6">
          <p className="text-white font-semibold mb-2">Example Match Score</p>
          <div className="w-full bg-gray-700 rounded-full h-5 overflow-hidden">
            <div
              className="bg-blue-500 h-5 rounded-full transition-all duration-1000"
              style={{ width: "78%" }}
              aria-valuenow={78}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-blue-400 mt-1 font-medium">78%</p>
        </div>
      </div>
    </div>
  

  
</div>

);
}
