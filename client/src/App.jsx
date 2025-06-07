import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignIn } from "@clerk/clerk-react";

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
                afterSignOutUrl="/sign-in" // redirect to SignIn page component on sign out
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
            {/* Redirect any unknown route to /upload */}
            <Route path="*" element={<Navigate to="/upload" replace />} />
          </Routes>
        </div>
      </SignedIn>

      {/* -------- UNAUTHENTICATED -------- */}
      <SignedOut>
        <Routes>
          {/* Render Clerk's SignIn component here */}
          <Route
            path="/sign-in"
            element={<SignIn path="/sign-in" routing="path" redirectUrl="/upload" />}
          />
          {/* Redirect any unknown route to sign-in page */}
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </SignedOut>
    </BrowserRouter>
  );
}
