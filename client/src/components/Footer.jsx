import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi"; // added icon for feature list

const ResumeAnalyzerFooter = () => {
  const navigate = useNavigate();

  const handleCreateResume = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/create-ats-resume"), 300);
  };

  return (
    <footer className="relative mt-24 px-6 py-16 bg-black text-gray-300 border-t border-gray-700/40 shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
      {/* subtle layered glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-blue-500/20 blur-3xl rounded-full" />

      <div className="max-w-6xl mx-auto text-center space-y-12">
        {/* Logo & Title */}
        <h3 className="inline-flex items-center gap-3 justify-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
          <span className="bg-clip-text text-white">
            FitForHire
          </span>
          <span className="text-blue-500 text-2xl sm:text-3xl">✓</span>
        </h3>

        {/* Short description */}
        <p className="mx-auto max-w-3xl leading-relaxed text-base sm:text-lg md:text-[1.1rem] text-gray-400">
          <span className="font-semibold text-white">FitForHire</span> is your AI-powered career companion. It analyzes your résumé against any job description and delivers clear, personalized feedback—from keyword optimization to ATS-ready formatting—helping you land interviews faster.
        </p>

        {/* Feature grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left text-sm sm:text-base">
          {[
            "Instant résumé evaluation with AI insights",
            "Keyword and phrasing improvements",
            "Tailored feedback for each job posting",
            "ATS compatibility checklist",
            "Highlight missing qualifications",
            "Actionable tips to boost success rate",
            "Clean formatting & layout guidance",
            "Enhanced recruiter readability",
            "Professional tone & grammar fixes",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-gray-300">
              <FiCheckCircle className="flex-shrink-0 text-blue-500 mt-[2px]" size={18} />
              {feature}
            </li>
          ))}
        </ul>

        {/* Call to action */}
        <div className="space-y-5">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
            ➤ Your dream job starts with the right résumé!
          </p>

          <button
            onClick={handleCreateResume}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full
                       bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700
                       active:scale-[.97] focus-visible:outline-none
                       text-white text-base sm:text-[15px] font-semibold
                       shadow-lg shadow-blue-600/30 transition duration-300"
          >
            → Build My AI-Optimized Résumé
          </button>
        </div>

        {/* subtle bottom border glow */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-[1px]" />
      </div>
    </footer>
  );
};

export default ResumeAnalyzerFooter;


