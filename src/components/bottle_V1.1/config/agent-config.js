// agent-config.js - Comprehensive configuration for both agents
import { 
  faRobot, 
  faBrain, 
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
  faHistory,
  faUpload,
  faKey,
  faCrown
} from '@fortawesome/free-solid-svg-icons';

// Create a lookup object for easy access to agent configurations
const agentConfigMap = {};

/**
 * Get agent configuration objects
 * Creates complete configuration for chat agents
 */
export const createAgentConfig = () => {
  // Base configuration that applies to all agents
  const baseConfig = {
    // API configuration
    api: {
      model: "gemini-2.0-flash",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 2048,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    },
    
    // Subscription tiers and limits
    subscription: {
      free: {
        dailyInteractions: 5,
        responseQuality: "standard",
        responseTime: "normal",
        historyRetention: 1, // days
        features: {
          history: false,
          fileUpload: false,
          customPrompts: false,
          apiAccess: false,
          export: false
        }
      },
      basic: {
        price: 9.99,
        billingCycle: "monthly",
        dailyInteractions: 50,
        responseQuality: "enhanced",
        responseTime: "faster",
        historyRetention: 30, // days
        features: {
          history: true,
          fileUpload: false,
          customPrompts: false,
          apiAccess: false,
          export: true
        }
      },
      pro: {
        price: 19.99,
        billingCycle: "monthly",
        dailyInteractions: 1000,
        responseQuality: "premium",
        responseTime: "fastest",
        historyRetention: 90, // days
        features: {
          history: true,
          fileUpload: true,
          customPrompts: false,
          apiAccess: false,
          export: true
        }
      },
      premium: {
        price: 49.99,
        billingCycle: "monthly",
        dailyInteractions: Infinity,
        responseQuality: "premium",
        responseTime: "fastest",
        historyRetention: 365, // days
        features: {
          history: true,
          fileUpload: true,
          customPrompts: true,
          apiAccess: true,
          export: true
        },
        apiQuota: 10000 // API calls per month
      }
    },
    
    // Chat UI configuration
    ui: {
      messageBubbleRadius: "12px",
      inputBorderRadius: "12px",
      buttonStyle: {
        borderRadius: "12px",
        fontSize: "1rem"
      },
      animation: {
        messageTransition: "all 0.3s ease",
        loadingDots: true
      }
    }
  };
  
  // TechGenie specific configuration
  const techGenieConfig = {
    ...baseConfig,
    id: "tech-genie",
    name: "TechGenie",
    description: "Expert technology consultant for all your tech needs",
    icon: faRobot,
    initialPrompt: "You are TechGenie, an expert computer technology consultant. Assist users with their tech-related questions. Provide specific, practical advice with examples when possible.",
    initialResponse: "Hello! I'm TechGenie, your expert tech consultant. I can help you with hardware recommendations, software troubleshooting, coding questions, and any other tech-related inquiries. What can I assist you with today?",
    placeholders: {
      input: "Ask me anything about technology...",
      noCredits: "Upgrade to continue asking questions!",
      premium: "Premium access enabled! Ask anything..."
    },
    themes: {
      light: {
        primary: "#2563eb",     /* Royal Blue */
        secondary: "#1e40af",   /* Darker Blue */
        accent: "#22c55e",      /* Success Green */
        warning: "#eab308",     /* Warning Yellow */
        error: "#dc2626",       /* Error Red */
        bg: "#ffffff",
        surface: "#f8fafc", 
        text: "#1e293b",
      },
      dark: {
        primary: "#2563eb",
        secondary: "#1e40af",
        accent: "#22c55e",
        warning: "#eab308",
        error: "#dc2626",
        bg: "#0f172a",
        surface: "#1e293b",
        text: "#f8fafc",
      }
    },
    defaultTheme: "dark",
    expertise: [
      {
        name: "Programming",
        icon: faCode,
        description: "Help with coding questions, debugging, language selection",
        sampleQuestions: [
          "How do I fix this JavaScript error?",
          "What's the best language for web development?",
          "Can you explain how this Python code works?"
        ]
      },
      {
        name: "Software",
        icon: faLaptopCode,
        description: "Software recommendations, troubleshooting, configuration",
        sampleQuestions: [
          "What's the best photo editing software for beginners?",
          "How do I fix Windows update issues?",
          "Which productivity tools do you recommend?"
        ]
      },
      {
        name: "Hardware",
        icon: faServer,
        description: "Device recommendations, compatibility, troubleshooting",
        sampleQuestions: [
          "What specs should I look for in a gaming laptop?",
          "Why is my computer running slow?",
          "How do I upgrade my RAM?"
        ]
      },
      {
        name: "Databases",
        icon: faDatabase,
        description: "Database design, optimization, and problem solving",
        sampleQuestions: [
          "How do I structure my database for an e-commerce site?",
          "What's the difference between SQL and NoSQL?",
          "How can I optimize this query?"
        ]
      },
      {
        name: "Networking",
        icon: faNetworkWired,
        description: "Network setup, troubleshooting, and security",
        sampleQuestions: [
          "How do I secure my home Wi-Fi?",
          "What could cause intermittent connectivity issues?",
          "How do VPNs work?"
        ]
      }
    ],
    actions: {
      copyCode: {
        icon: faClipboard,
        label: "Copy code"
      },
      saveResponse: {
        icon: faSave,
        label: "Save response"
      }
    },
    premiumFeatures: {
      history: {
        icon: faHistory,
        name: "Chat History",
        description: "Access and search your past conversations",
        tier: "basic"
      },
      fileUpload: {
        icon: faUpload,
        name: "File Upload",
        description: "Upload code files for analysis and debugging",
        tier: "pro",
        formats: ["txt", "js", "py", "java", "cpp", "html", "css", "json", "csv"]
      },
      apiAccess: {
        icon: faKey,
        name: "API Access",
        description: "Integrate TechGenie into your applications",
        tier: "premium",
        endpoints: [
          {
            path: "/api/tech/query",
            method: "POST",
            description: "Send a technology question and receive an expert answer"
          },
          {
            path: "/api/tech/analyze",
            method: "POST",
            description: "Upload code for analysis and recommendations"
          }
        ]
      },
      customPrompts: {
        icon: faCrown,
        name: "Custom Prompt Templates",
        description: "Create specialized tech assistant personas",
        tier: "premium",
        templates: [
          {
            name: "Code Reviewer",
            prompt: "You are a senior software engineer reviewing code. Focus on code quality, performance issues, and security concerns."
          },
          {
            name: "System Architect",
            prompt: "You are a systems architect helping design scalable, robust technical solutions. Focus on best practices and long-term maintainability."
          }
        ]
      }
    },
    interactionName: "Questions",
    analytics: {
      categories: [
        "Programming",
        "Hardware",
        "Software",
        "Networking",
        "Databases",
        "Security",
        "Cloud",
        "Mobile"
      ],
      trackTopics: true,
      trackCodeLanguages: true,
      trackResolutionRate: true
    }
  };
  
  // MindfulMate specific configuration
  const mindfulMateConfig = {
    ...baseConfig,
    id: "mindful-mate",
    name: "MindfulMate",
    description: "Your supportive mental wellness companion",
    icon: faBrain,
    initialPrompt: "You are MindfulMate, a supportive mental wellness companion. You provide evidence-based self-help techniques, coping strategies, and mindfulness exercises. You carefully avoid making medical diagnoses or replacing professional mental health care. For serious concerns, you always recommend seeking professional help.",
    initialResponse: "Hello! I'm MindfulMate, your supportive mental wellness companion. I'm here to listen and provide evidence-based coping strategies, mindfulness exercises, and self-help techniques. Remember that I'm not a replacement for professional mental healthcare - if you're experiencing severe distress, please reach out to a qualified mental health professional. How are you feeling today?",
    placeholders: {
      input: "Share what's on your mind...",
      noCredits: "Upgrade to continue your wellness journey",
      premium: "Premium access enabled! How are you feeling?"
    },
    themes: {
      bright: {
        primary: "#5B9AA0",     /* Teal Blue */
        secondary: "#457B9D",   /* Darker Blue */
        accent: "#A8DADC",      /* Light Teal */
        warning: "#F8961E",     /* Warm Orange */
        error: "#E63946",       /* Soft Red */
        bg: "#ffffff",
        surface: "#F8F9FA",
        text: "#1D3557",
      },
      calm: {
        primary: "#5B9AA0",
        secondary: "#457B9D",
        accent: "#A8DADC",
        warning: "#F8961E",
        error: "#E63946",
        bg: "#1D3557",
        surface: "#2A4A73",
        text: "#F1FAEE",
      }
    },
    defaultTheme: "calm",
    moods: [
      {
        name: "happy",
        emoji: "😊",
        label: "Happy",
        responseType: "celebratory and reinforcing positive feelings"
      },
      {
        name: "calm",
        emoji: "😌",
        label: "Calm",
        responseType: "grounding and present-moment focused"
      },
      {
        name: "anxious",
        emoji: "😰",
        label: "Anxious",
        responseType: "soothing and offering anxiety management techniques"
      },
      {
        name: "sad",
        emoji: "😢",
        label: "Sad",
        responseType: "empathetic and gently uplifting"
      },
      {
        name: "angry",
        emoji: "😠",
        label: "Angry",
        responseType: "validating while offering healthy expression techniques"
      }
    ],
    expertise: [
      {
        name: "Emotional Support",
        icon: faHeart,
        description: "Compassionate listening and emotional validation",
        sampleQuestions: [
          "I'm feeling overwhelmed with work",
          "How can I process grief?",
          "I'm struggling with rejection"
        ]
      },
      {
        name: "Mindfulness",
        icon: faLeaf,
        description: "Present-moment awareness techniques",
        sampleQuestions: [
          "How do I start meditating?",
          "Quick mindfulness exercises for anxiety",
          "Help me be more present"
        ]
      },
      {
        name: "Meditation",
      
        description: "Guided meditation scripts and practice tips",
        sampleQuestions: [
          "Guide me through a breathing meditation",
          "How do I quiet my mind?",
          "Meditation for better sleep"
        ]
      },
      {
        name: "Work-Life Balance",
        icon: faBalanceScale,
        description: "Setting boundaries and managing stress",
        sampleQuestions: [
          "How do I prevent burnout?",
          "Setting boundaries with coworkers",
          "Managing workday stress"
        ]
      },
      {
        name: "Sleep",
        icon: faMoon,
        description: "Improving sleep quality and routines",
        sampleQuestions: [
          "How can I fall asleep faster?",
          "Creating a bedtime routine",
          "Dealing with racing thoughts at night"
        ]
      }
    ],
    actions: {
      saveToJournal: {
        icon: faSave,
        label: "Save to journal"
      }
    },
    premiumFeatures: {
      history: {
        icon: faHistory,
        name: "Wellness Journal",
        description: "Track your emotional journey and progress",
        tier: "basic",
      },
      customExercises: {
        icon: faUpload,
        name: "Custom Exercises",
        description: "Personalized mindfulness and meditation exercises",
        tier: "pro"
      },
      apiAccess: {
        icon: faKey,
        name: "API Access",
        description: "Integrate MindfulMate into your wellness applications",
        tier: "premium",
        endpoints: [
          {
            path: "/api/wellness/respond",
            method: "POST",
            description: "Send a wellness question and receive supportive guidance"
          },
          {
            path: "/api/wellness/exercises",
            method: "GET",
            description: "Retrieve mindfulness exercises and meditation scripts"
          }
        ]
      },
      customPrompts: {
        icon: faCrown,
        name: "Custom Wellness Companions",
        description: "Create specialized wellness assistant personas",
        tier: "premium",
        templates: [
          {
            name: "Sleep Coach",
            prompt: "You are a sleep science expert focused on helping users develop healthy sleep habits and overcome insomnia through evidence-based techniques."
          },
          {
            name: "Mindfulness Guide",
            prompt: "You are a mindfulness meditation instructor specializing in present-moment awareness techniques for stress reduction and emotional regulation."
          }
        ]
      }
    },
    interactionName: "Sessions",
    crisisResources: {
      title: "Crisis Resources",
      icon: "heartbeat",
      message: "If you're experiencing a mental health emergency:",
      resources: [
        "National Suicide Prevention Lifeline: 988 or 1-800-273-8255",
        "Crisis Text Line: Text HOME to 741741",
        "Call your local emergency number: 911"
      ],
      showAlways: true
    },
    analytics: {
      categories: [
        "Anxiety",
        "Depression",
        "Stress",
        "Sleep",
        "Relationships",
        "Work",
        "Meditation",
        "General Wellness"
      ],
      trackMoods: true,
      trackTopics: true,
      trackExerciseUsage: true
    },
    disclaimers: {
      notMedical: "MindfulMate provides self-help resources and is not a substitute for professional mental health care.",
      seekHelp: "If you're experiencing severe distress or having thoughts of harming yourself or others, please contact a mental health professional or emergency services immediately."
    }
  };
  
  // Add configs to the lookup map
  agentConfigMap["tech-genie"] = techGenieConfig;
  agentConfigMap["mindful-mate"] = mindfulMateConfig;
  
  // Create an array of all configs for iteration
  const allConfigs = [techGenieConfig, mindfulMateConfig];
  
  // Return object with proper finder methods
  return {
    techGenie: techGenieConfig,
    mindfulMate: mindfulMateConfig,
    getByMode: (mode) => mode === "tech" ? techGenieConfig : mindfulMateConfig,
    
    // Find agent by ID - safer than using .find() on the object
    getById: (id) => agentConfigMap[id] || null,
    
    // Find agent by property value
    findByProperty: (propertyName, value) => {
      for (const config of allConfigs) {
        if (config[propertyName] === value) {
          return config;
        }
      }
      return null;
    },
    
    // Get all configs as an array for iteration
    getAllConfigs: () => [...allConfigs],
    
    // Check if an agent exists
    hasAgent: (id) => id in agentConfigMap
  };
};

// Export a ready-to-use instance of the configurations
export const agentConfig = createAgentConfig();

// Export API tier configurations for the API Gateway monetization model
export const apiTiers = {
  developer: {
    name: "Developer",
    price: 99,
    billingCycle: "monthly",
    limits: {
      callsPerDay: 1000,
      modelsAvailable: ["gemini-2.0-flash"],
      responseTime: "standard",
      supportLevel: "community"
    },
    features: {
      documentation: "basic",
      retryLogic: true,
      errorHandling: "standard"
    }
  },
  business: {
    name: "Business",
    price: 299,
    billingCycle: "monthly",
    limits: {
      callsPerDay: 5000,
      modelsAvailable: ["gemini-2.0-flash", "gemini-2.0-pro"],
      responseTime: "priority",
      supportLevel: "email"
    },
    features: {
      documentation: "advanced",
      retryLogic: true,
      errorHandling: "enhanced",
      customEndpoint: true,
      webhooks: true
    }
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    billingCycle: "monthly/yearly",
    limits: {
      callsPerDay: "Unlimited",
      modelsAvailable: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-2.0-ultra"],
      responseTime: "fastest",
      supportLevel: "dedicated"
    },
    features: {
      documentation: "advanced",
      retryLogic: true,
      errorHandling: "premium",
      customEndpoint: true,
      webhooks: true,
      onPremise: true,
      sla: true,
      customModels: true
    }
  },
  payAsYouGo: {
    name: "Pay As You Go",
    baseFee: 20,
    billingCycle: "monthly",
    perCallPricing: {
      techGenie: 0.02,
      mindfulMate: 0.015
    },
    volumeDiscounts: [
      { threshold: 5000, discount: 0.10 }, // 10% off above 5000 calls
      { threshold: 20000, discount: 0.20 }, // 20% off above 20000 calls
      { threshold: 50000, discount: 0.30 } // 30% off above 50000 calls
    ],
    limits: {
      modelsAvailable: ["gemini-2.0-flash"],
      responseTime: "standard",
      supportLevel: "email"
    },
    features: {
      documentation: "basic",
      retryLogic: true,
      errorHandling: "standard"
    }
  }
};