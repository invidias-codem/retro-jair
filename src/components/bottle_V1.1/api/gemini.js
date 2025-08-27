import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;

const initializeApi = () => {
    if (genAIInstance) return genAIInstance;
    const apiKey = process.env.REACT_APP_GEMINI_API;
    if (!apiKey) {
        console.error("API key not found. Please check your environment variables.");
        throw new Error("API key is missing.");
    }
    try {
        genAIInstance = new GoogleGenerativeAI(apiKey);
        return genAIInstance;
    } catch (error) {
        console.error("Failed to initialize Gemini API:", error);
        throw error;
    }
};

export const startChatSession = async (agentConfig) => {
    const genAI = initializeApi();
    const model = genAI.getGenerativeModel({ model: agentConfig.api.model });

    const initialHistory = [
        { role: "user", parts: [{ text: agentConfig.initialPrompt }] },
        { role: "model", parts: [{ text: agentConfig.initialResponse }] },
    ];
    
    const generationConfig = {
        temperature: agentConfig.api.temperature,
        topK: agentConfig.api.topK,
        topP: agentConfig.api.topP,
        maxOutputTokens: agentConfig.api.maxOutputTokens,
    };

    const chat = await model.startChat({
        history: initialHistory,
        generationConfig: generationConfig,
        safetySettings: agentConfig.api.safetySettings,
    });

    return chat;
};

/**
 * REVISED: Sends a message using a robust method that handles multiple response types.
 */
export const sendMessage = async (chat, prompt) => {
    const result = await chat.sendMessage(prompt);
    const response = result.response;

    try {
        // First, try the most common and simple way to get text.
        // The .text() helper is convenient and handles simple cases.
        const text = response.text();
        if (text) {
            return text;
        }
    } catch (e) {
        // If .text() fails, it's likely a complex response (e.g., blocked).
        // We will now inspect it manually.
        console.warn("Could not get text with .text() helper, inspecting response manually.", e);
    }
    
    // Manual inspection for text parts or safety feedback.
    if (response.candidates && response.candidates.length > 0) {
        const firstCandidate = response.candidates[0];
        // If content exists, join all text parts.
        if (firstCandidate.content && firstCandidate.content.parts) {
            const textParts = firstCandidate.content.parts
                .map(part => part.text)
                .filter(Boolean); // Filter out any empty parts
            if (textParts.length > 0) {
                return textParts.join("\n\n");
            }
        }
    }

    // If we're here, no text was found. Check for a block reason.
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Your request was blocked for safety reasons: ${response.promptFeedback.blockReason}.`);
    }

    // Fallback error if no other condition is met.
    throw new Error("The AI returned an empty or unreadable response.");
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