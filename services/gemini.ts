import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("API_KEY environment variable is missing. AI features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

export const generateGeminiResponse = async (prompt: string): Promise<string> => {
  if (!ai) {
    return "AI Unavailable: API Key not configured.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error contacting AI service. Please try again later.";
  }
};