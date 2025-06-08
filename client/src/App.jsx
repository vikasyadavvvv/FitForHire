import React, { useState } from "react";
import {  Routes, Route, Navigate, useNavigate, HashRouter } from "react-router-dom";
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignIn, 
  SignUp,
  RedirectToSignIn 
} from "@clerk/clerk-react";

import UploadForm from "./components/UploadForm";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import { useAuth } from '@clerk/clerk-react';
import ResumeForm from "./components/ResumeForm";
// Inside your component:



function AppRoutes() {
  const [extractedResumeText, setExtractedResumeText] = useState("");
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();
console.log('Auth state:', { isLoaded, userId });

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
            <Route path='/create-ats-resume'  element={<ResumeForm/>}></Route>
            
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
                  afterSignInUrl ="/upload"
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
  return (
   
    <HashRouter>

        <AppRoutes />

    </HashRouter>
  );
}