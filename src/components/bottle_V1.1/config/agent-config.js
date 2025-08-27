// agent-config.js - Comprehensive configuration for all agents
import {
  faRobot,
  faBrain,
  faBookBible,
  faFlask,
  faCode,
  faLaptopCode,
  faServer,
  faDatabase,
  faNetworkWired,
  faHeart,
  faLeaf,
  faBalanceScale,
  faMoon,
  faClipboard,
  faSave,
} from '@fortawesome/free-solid-svg-icons';

const agentConfigMap = {};

export const createAgentConfig = () => {
  const baseConfig = {
    api: {
      model: "gemini-1.5-flash-latest",
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
    id: "tech-genie",
    name: "TechGenie",
    vapiAssistantId: "5a9be56c-a464-4ccb-acef-c5c49fce3a6c",
    icon: faRobot,
    initialPrompt: "You are TechGenie, an expert computer technology consultant...",
    initialResponse: "Hello! I'm TechGenie, your expert tech consultant...",
    placeholders: {
      input: "Ask me anything about technology...",
      noCredits: "Upgrade to continue asking questions!",
    },
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
      headerClass: "tech-header",
      logoClass: "tech-logo",
      logoIconClass: "tech-logo-icon",
      logoTextClass: "tech-logo-text",
      controlsClass: "tech-controls",
      subscriptionBadgeClass: "tech-subscription-badge",
      messagesClass: "tech-messages",
      messageClass: "tech-message",
      messageBubbleClass: "tech-message-bubble",
      footerClass: "tech-footer",
      inputClass: "tech-input",
      sendButtonClass: "tech-send-button",
      buttonClass: "tech-button",
      loaderClass: "tech-loading",
      errorMessageClass: "tech-error-message",
    }
  };

  const bishopAiConfig = {
    ...baseConfig,
    id: "bishop-ai",
    name: "Bishop AI",
    icon: faBookBible,
    initialPrompt: `You are Bishop AI, a compassionate and insightful guide...`,
    initialResponse: "Peace be with you. I am Bishop AI...",
    placeholders: {
      input: "Seek wisdom from the Word (KJV)...",
      noCredits: "Further consultation requires deepening your commitment.",
    },
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
        headerClass: "bishop-header",
        logoClass: "bishop-logo",
        logoIconClass: "bishop-logo-icon",
        logoTextClass: "bishop-logo-text",
        controlsClass: "bishop-controls",
        subscriptionBadgeClass: "bishop-subscription-badge",
        messagesClass: "bishop-messages",
        messageClass: "bishop-message",
        messageBubbleClass: "bishop-message-bubble",
        footerClass: "bishop-footer",
        inputClass: "bishop-input",
        sendButtonClass: "bishop-send-button",
        buttonClass: "bishop-button",
        loaderClass: "bishop-loading",
        errorMessageClass: "bishop-error-message",
    }
  };

  const professorAiConfig = {
    ...baseConfig,
    id: "professor-ai",
    name: "Professor AI",
    icon: faFlask,
    api: { // <-- Make sure to have a nested api object for the new model
      ...baseConfig.api,
      model: "gemini-1.5-flash-latest", // Text model
      imageModel: "gemini-pro-vision" // Image model
    },
    initialPrompt: "You are Professor AI, a knowledgeable and patient STEM tutor...",
    initialResponse: "Hello! I'm Professor AI. Ask me any STEM question...",
    placeholders: {
      input: "Ask a STEM question or describe a diagram...",
      noCredits: "Upgrade for unlimited STEM help!",
    },
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
        headerClass: "stem-header",
        logoClass: "stem-logo",
        logoIconClass: "stem-logo-icon",
        logoTextClass: "stem-logo-text",
        controlsClass: "stem-controls",
        subscriptionBadgeClass: "stem-subscription-badge",
        messagesClass: "stem-messages",
        messageClass: "stem-message",
        messageBubbleClass: "stem-message-bubble",
        footerClass: "stem-footer",
        inputClass: "stem-input",
        sendButtonClass: "stem-send-button",
        buttonClass: "stem-button",
        loaderClass: "stem-loading",
        errorMessageClass: "stem-error-message",
    }
  };

  agentConfigMap["tech-genie"] = techGenieConfig;
  agentConfigMap["bishop-ai"] = bishopAiConfig;
  agentConfigMap["professor-ai"] = professorAiConfig;

  return {
    getById: (id) => agentConfigMap[id] || null,
    getAllConfigs: () => Object.values(agentConfigMap),
  };
};

export const agentConfig = createAgentConfig();