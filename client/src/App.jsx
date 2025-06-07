import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignIn, 
  SignUp,
  ClerkProvider,
  RedirectToSignIn 
} from "@clerk/clerk-react";

import UploadForm from "./components/UploadForm";
import ResumeAnalyzer from "./components/ResumeAnalyzer";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function AppRoutes() {
  const [extractedResumeText, setExtractedResumeText] = useState("");
  const navigate = useNavigate();

  return (
    <>
      {/* -------- AUTHENTICATED -------- */}
      <SignedIn>
        <div className="min-h-screen bg-black text-white">
          <header className="flex items-center justify-between p-4 bg-gradient-to-r from-black via-gray-900 to-black shadow-md border-b border-gray-800 animate-fade-in-down">
            <h1 className="ml-8 text-4xl font-extrabold tracking-tight flex items-center gap-2">
              FitForHire <span className="text-blue-500 text-3xl">✓</span>
            </h1>
            <div className="mr-10">
              <UserButton
                afterSignOutUrl="/sign-in"
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
            path="/sign-in"
            element={
              <div className="min-h-screen bg-black flex items-center justify-center">
                <SignIn 
                  routing="path"
                  path="/sign-in"
                  afterSignInUrl="/upload"
                  afterSignUpUrl="/upload"
                />
              </div>
            }
          />
          <Route
            path="/sign-up"
            element={
              <div className="min-h-screen bg-black flex items-center justify-center">
                <SignUp 
                  routing="path"
                  path="/sign-up"
                  afterSignUpUrl="/upload"
                  afterSignInUrl="/upload"
                />
              </div>
            }
          />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      navigate={(to) => navigate(to)}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/upload"
      afterSignUpUrl="/upload"
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}