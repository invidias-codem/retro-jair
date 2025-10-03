// agent-config.js - Comprehensive configuration for all agents
import {
  faRobot,
  faBookBible,
  faFlask,
  faClipboard,
  faSave,
} from '@fortawesome/free-solid-svg-icons';

const agentConfigMap = {};

export const createAgentConfig = () => {
  const baseConfig = {
    api: {
      model: "gemini-2.0-flash",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 4096,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    },
    subscription: {
      free: {
        dailyInteractions: 15,
        responseQuality: "standard",
      },
    },
  };

  const techGenieConfig = {
    ...baseConfig,
    key: "tech", // Unique key for UI state management
    id: "tech-genie",
    deepResearch: true,
    name: "Tech Genie",
    emoji: '🤖',
    icon: faRobot,
    capabilities: { voice: true, attachments: false, canvas: false, math: false },
    vapiAssistantId: "5a9be56c-a464-4ccb-acef-c5c49fce3a6c",
    initialPrompt: "You are TechGenie, an expert computer technology consultant...",
    initialResponse: "Hello! I'm TechGenie, your expert tech consultant...",
    placeholders: {
      input: "Ask me anything about technology...",
      noCredits: "Upgrade to continue asking questions!",
    },
    // --- ADD THIS ---
    suggestions: [
      "What is the difference between React and Node.js?",
      "Explain the concept of an API in simple terms.",
      "How do I center a div in CSS?",
      "Write a python script to organize files in a folder."
    ],
    themes: {
      dark: {},
      light: {}
    },
    defaultTheme: "dark",
    interactionName: "Questions",
    actions: {
      copyCode: { icon: faClipboard, label: "Copy code" }
    },
    ui: {
      containerClass: "tech-chat-container",
    }
  };

  const bishopAiConfig = {
    ...baseConfig,
    key: "bishop", // Unique key for UI state management
    id: "bishop-ai",
    deepResearch: true,
    name: "Bishop AI",
    emoji: '📖',
    icon: faBookBible,
    capabilities: { voice: false, attachments: false, canvas: false, math: false },
    initialPrompt: `You are Bishop AI, a compassionate and insightful guide...`,
    initialResponse: "Peace be with you. I am Bishop AI...",
    placeholders: {
      input: "Seek wisdom from the Word (KJV)...",
      noCredits: "Further consultation requires deepening your commitment.",
    },
    // --- ADD THIS ---
    suggestions: [
        "Explain the story of Job.",
        "What does the Bible say about forgiveness?",
        "Who was King David?",
        "Share a scripture for encouragement."
    ],
    themes: {
      calm: {},
      dark: {}
    },
    defaultTheme: "calm",
    interactionName: "Consultations",
    actions: {
      saveToJournal: { icon: faSave, label: "Copy Scripture/Guidance" }
    },
    ui: {
        containerClass: "bishop-chat-container",
    }
  };

  const professorAiConfig = {
    ...baseConfig,
    api: {
      ...baseConfig.api,
      model: 'gemini-2.5-pro',
      imageModel: "gemini-pro-vision"
    },
    key: "stem", // Unique key for UI state management
    id: "professor-ai",
    deepResearch: true,
    name: "Professor AI",
    emoji: '🔬',
    icon: faFlask,
    capabilities: { voice: false, attachments: true, canvas: true, math: true },
    initialPrompt: "You are Professor AI, a knowledgeable and patient STEM tutor...",
    initialResponse: "Hello! I'm Professor AI. Ask me any STEM question...",
    placeholders: {
      input: "Ask a STEM question or describe a diagram...",
      noCredits: "Upgrade for unlimited STEM help!",
    },
    // --- ADD THIS ---
    suggestions: [
        "What is the Pythagorean theorem?",
        "Explain the process of photosynthesis.",
        "How does a black hole work?",
        "Describe the structure of an atom."
    ],
    themes: {
      light: {},
      dark: {}
    },
    defaultTheme: "light",
    interactionName: "Lessons",
    actions: {
      copyCode: { icon: faClipboard, label: "Copy explanation/formula" }
    },
    ui: {
        containerClass: "stem-chat-container",
    }
  };

  agentConfigMap["tech-genie"] = techGenieConfig;
  agentConfigMap["bishop-ai"] = bishopAiConfig;
  agentConfigMap["professor-ai"] = professorAiConfig;

  return {
    getById: (id) => agentConfigMap[id] || null,
    getAllConfigs: () => Object.values(agentConfigMap),
    
    getAllAsObject: () => {
        const configs = Object.values(agentConfigMap);
        return configs.reduce((acc, config) => {
            if (config.key) {
                acc[config.key] = config;
            }
            return acc;
        }, {});
    }
  };
};

export const agentConfig = createAgentConfig();