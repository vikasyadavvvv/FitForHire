import React from "react";
import { useNavigate } from "react-router-dom";

const ResumeAnalyzerFooter = () => {
  const navigate = useNavigate();

  const handleCreateResume = () => {
    navigate("/create-ats-resume");
  };

  return (
    <footer className="mt-10 px-6 py-10 text-sm text-gray-300 border-t border-gray-800 rounded-md shadow-inner">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-white mb-4 tracking-wide">
          About <span className="text-blue-500">FitForHire</span>
        </h3>

        <p className="mb-6 text-gray-400 text-base leading-relaxed font-medium">
          <span className="text-white font-semibold">FitForHire</span> is your AI-powered career assistant. It compares your resume with job descriptions and delivers precise, personalized suggestions. From ATS-friendly formatting to insightful content improvements — we help you land your next opportunity faster.
        </p>

        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 list-disc list-inside text-left mb-8 text-base text-gray-300 max-w-2xl mx-auto">
          <li>Skill gap analysis</li>
          <li>Experience alignment insights</li>
          <li>Education and certification review</li>
          <li>Resume formatting suggestions</li>
          <li>Soft skills & cultural fit evaluation</li>
          <li>Personalized improvement suggestions</li>
          <li>Bullet point enhancements</li>
          <li>ATS-friendly resume generation</li>
          <li>Interview preparation tips</li>
          <li>Candidate comparison overview</li>
        </ul>

        <p className="text-lg font-semibold text-white mb-4">
          🎯 Your dream job starts with the right resume!
        </p>

        <button
          onClick={handleCreateResume}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-full shadow-lg transition-all duration-300"
        >
          🚀 Build My AI-Optimized Resume
        </button>
      </div>
    </footer>
  );
};

export default ResumeAnalyzerFooter;

