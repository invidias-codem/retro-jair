import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;

const initializeApi = (apiKey) => {
  if (!apiKey) {
    const envKey = process.env.REACT_APP_GEMINI_API;
    if (!envKey) {
      throw new Error("API key not found. Please check your environment configuration.");
    }
    apiKey = envKey;
  }
  
  if (!genAIInstance) {
    try {
      genAIInstance = new GoogleGenerativeAI(apiKey);
    } catch (err) {
      console.error("Failed to initialize Gemini API:", err);
      throw new Error("Failed to initialize API.");
    }
  }
  
  return genAIInstance;
};

export const startChatSession = async (agentConfig) => {
  // Initialize API with the agent's API key or fallback to env
  const apiKey = agentConfig.api?.apiKey || process.env.REACT_APP_GEMINI_API;
  const genAI = initializeApi(apiKey);

  if (!genAI) {
    throw new Error("Gemini API is not initialized. Please check your API key configuration.");
  }

  const model = genAI.getGenerativeModel({
    model: agentConfig.api?.model || "gemini-2.0-flash-exp",
    generationConfig: agentConfig.api?.generationConfig || {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
    safetySettings: agentConfig.api?.safetySettings || [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  });

  const chat = model.startChat({
    history: agentConfig.history || [],
  });

  return chat;
};

export const sendMessage = async (chat, prompt) => {
  try {
    const result = await chat.sendMessage(prompt);
    const response = result.response;

    // Try to get text using the helper method
    try {
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (e) {
      console.warn("Could not get text with .text() helper, inspecting response manually.", e);
    }
    
    // Manual inspection for text parts
    if (response.candidates && response.candidates.length > 0) {
      const firstCandidate = response.candidates[0];
      if (firstCandidate.content && firstCandidate.content.parts) {
        const textParts = firstCandidate.content.parts
          .map(part => part.text)
          .filter(Boolean);
        if (textParts.length > 0) {
          return textParts.join("\n\n");
        }
      }
    }

    // Check for block reason
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Your request was blocked for safety reasons: ${response.promptFeedback.blockReason}.`);
    }

    throw new Error("The AI returned an empty or unreadable response.");
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

export const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as string."));
      }
      const base64Data = reader.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  const base64Data = await base64EncodedDataPromise;

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

export const generateImage = async (prompt, imageModelName) => {
  if (!imageModelName) return null;
  try {
    const genAI = initializeApi();
    const imageModel = genAI.getGenerativeModel({ model: imageModelName });
    const result = await imageModel.generateContent(prompt);
    const response = result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image generation API call failed:", error);
    throw new Error("Image generation failed. The model may be unavailable or the prompt was rejected.");
  }
};
