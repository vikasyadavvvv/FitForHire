import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getFitnessModel = () =>
  genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // Updated to latest flash model
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      responseMimeType: "application/json"
    }
  });
export { genAI, getFitnessModel };
