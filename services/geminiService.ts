import { GoogleGenAI, Modality } from "@google/genai";
import { pcmToWav, decodeBase64 } from "./audioUtils";

const apiKey = process.env.API_KEY || '';

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a simplified explanation of a page image in Arabic.
 */
export const explainPageImage = async (base64Image: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Remove data URL prefix if present (data:image/png;base64,)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analyze this page image. 
    Explain the content simply and clearly in Arabic suitable for a student.
    
    Guidelines:
    1. **Structure**: Use Markdown formatting (Headers, Bold text, Bullet points) to organize the explanation clearly.
    2. **Language**: Write the explanation in simplified Arabic.
    3. **Terminology**: Keep technical terms, definitions, and specific keywords in their original language (English/French etc.) within the Arabic text (e.g., "الخلية (Cell) هي...").
    4. **Focus**: Focus on the educational concepts and key takeaways.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assumes canvas export is PNG
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "عذراً، لم أتمكن من شرح هذه الصفحة.";
  } catch (error) {
    console.error("Explanation Error:", error);
    throw error;
  }
};

/**
 * Converts text to speech using Gemini TTS.
 * Returns a Blob URL for the audio.
 */
export const generatePageAudio = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  // For TTS, we might want to strip some heavy markdown symbols if they affect pronunciation,
  // but usually TTS models handle basic text well.
  // We send the text as is.

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Deep, calm voice suitable for study
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    // Convert Base64 -> Raw PCM -> WAV Blob
    const pcmData = decodeBase64(base64Audio);
    const wavBlob = pcmToWav(pcmData, 24000); // 24kHz is standard for Flash TTS
    
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};