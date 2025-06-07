import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

import UploadForm from "./components/UploadForm";
import ResumeAnalyzer from "./components/ResumeAnalyzer";

export default function App() {
  const [extractedResumeText, setExtractedResumeText] = useState("");

  return (
    <BrowserRouter>
      {/* -------- AUTHENTICATED -------- */}
      <SignedIn>
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between p-4 bg-gradient-to-r from-black via-gray-900 to-black shadow-md border-b border-gray-800 animate-fade-in-down">
            <h1 className="ml-8 text-4xl font-extrabold tracking-tight flex items-center gap-2">
              FitForHire <span className="text-blue-500 text-3xl">✓</span>
            </h1>
            <div className="mr-10">
              <UserButton
                afterSignOutUrl="https://proper-tetra-73.accounts.dev/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "ring-2 ring-blue-500 hover:ring-pink-500 transition duration-300 ease-in-out",
                  },
                }}
              />
            </div>
          </header>

          <Routes>
            <Route
              path="/upload"
              element={<UploadForm onExtractedText={setExtractedResumeText} />}
            />
            <Route
              path="/analyze"
              element={<ResumeAnalyzer resumeText={extractedResumeText} />}
            />
            <Route path="*" element={<Navigate to="/upload" replace />} />
          </Routes>
        </div>
      </SignedIn>

      {/* -------- UNAUTHENTICATED -------- */}
      <SignedOut>
        <Routes>
          <Route
            path="*"
            element={
              <Navigate
                to="https://proper-tetra-73.accounts.dev/sign-in"
                replace
              />
            }
          />
        </Routes>
      </SignedOut>
    </BrowserRouter>
  );
}
