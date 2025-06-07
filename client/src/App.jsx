import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignUp,
  UserButton,
} from "@clerk/clerk-react";

import UploadForm from "./components/UploadForm";
import ResumeAnalyzer from "./components/ResumeAnalyzer";

export default function App() {
  const [extractedResumeText, setExtractedResumeText] = useState("");

  return (
    <BrowserRouter>
      <SignedIn>
        {/* Page wrapper */}
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <header className="flex items-center justify-between p-4 bg-gradient-to-r from-black via-gray-900 to-black shadow-md border-b border-gray-800 animate-fade-in-down">
            <h1 className="ml-8 text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
              FitForHire
              <span className="text-blue-500 text-3xl">✓</span>
            </h1>
            <div className="mr-10">
              <UserButton
                afterSignOutUrl="/sign-up" // Redirect to sign-up after sign-out
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "ring-2 ring-blue-500 hover:ring-pink-500 transition duration-300 ease-in-out",
                  },
                }}
              />
            </div>
          </header>

          {/* Routes for signed-in users */}
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

      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Routes>
            <Route
              path="/sign-up"
              element={
                <div className="w-full max-w-md">
                  <SignUp 
                    path="/sign-up"
                    routing="path"
                    redirectUrl="/upload" 
                  />
                </div>
              }
            />
            {/* Force redirect to sign-up for any other path */}
            <Route path="*" element={<Navigate to="/sign-up" replace />} />
          </Routes>
        </div>
      </SignedOut>
    </BrowserRouter>
  );
}
