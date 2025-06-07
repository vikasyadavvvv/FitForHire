import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getFitnessModel = () =>
  genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // Updated to latest flash model
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      responseMimeType: "application/json"
    }
  });
