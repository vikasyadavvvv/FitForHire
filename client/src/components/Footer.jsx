import React from "react";
import { useNavigate } from "react-router-dom";

const ResumeAnalyzerFooter = () => {
  const navigate = useNavigate();

  const handleCreateResume = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/create-ats-resume"), 300);
  };

  return (
    <footer className="relative mt-20 px-6 py-14 text-gray-300
                       bg-black border-t border-slate-700/60 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)]
                       overflow-hidden">
      {/* faint top glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-4 h-16
                      bg-gradient-to-b from-blue-600/30 via-transparent to-transparent blur-xl" />

      <div className="max-w-5xl mx-auto text-center space-y-10">
        {/* Heading */}
        <h3 className="inline-flex items-center gap-2 justify-center
                       text-3xl sm:text-4xl font-extrabold tracking-wide text-white">
          <span className="text-white">
            FitForHire
          </span>
          <span className="text-blue-500 text-2xl">✓</span>
        </h3>

        {/* Description */}
        <p className="mx-auto max-w-3xl leading-relaxed text-base sm:text-[1.05rem] text-gray-400">
          <span className="font-semibold text-white">FitForHire</span> is your
          AI-powered career assistant. It compares your résumé against any job
          description and delivers precise, personalized feedback—from
          keyword-tuned phrasing to ATS-ready formatting—so you land interviews
          faster.
        </p>

        {/* Feature grid */}
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto
                     text-left text-sm sm:text-base"
        >
          {[
            "Instant résumé evaluation with AI insights",
            "Keyword and phrasing improvements",
            "Tailored feedback for each job posting",
            "ATS compatibility check-list",
            "Highlight missing qualifications",
            "Actionable tips to boost success rate",
            "Clear formatting & layout guidance",
            "Enhanced recruiter readability",
            "Professional tone & grammar fixes",
            "Step-by-step résumé upgrading workflow",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 leading-snug text-gray-300"
            >
              <span className="mt-[3px] h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="space-y-5">
          <p className="text-lg sm:text-xl font-semibold text-white">
            ➤ Your dream job starts with the right résumé!
          </p>

          <button
            onClick={handleCreateResume}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                       bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700
                       active:scale-[.97] focus-visible:outline-none
                       text-white text-sm sm:text-[15px] font-semibold
                       shadow-lg transition duration-300"
          >
            → Build My AI-Optimized Résumé
          </button>
        </div>
      </div>
    </footer>
  );
};

export default ResumeAnalyzerFooter;

