// agent-config.js - Comprehensive configuration for all agents
import {
  faRobot,
  faBookBible,
  faFlask,
  faClipboard,
  faSave,
} from '@fortawesome/free-solid-svg-icons';

const agentConfigMap = {};

// --- Helper for Output Formatting Rules ---
const OUTPUT_FORMATTING_RULES_BASE = `
**Output Formatting Rules:**
* **Text:** Use standard Markdown for all text formatting (bold, italics, lists, etc.). Ensure responses are clear, concise, and easy to read.
* **Code:** Format all code blocks using Markdown fences (\`\`\`language ... \`\`\`), specifying the language where possible.
* **Tables:** If data is best presented in a table, use Markdown table syntax.
`;

const OUTPUT_FORMATTING_RULES_GRAPH = `
* **Graphs:** If specifically asked to visualize data, or if data comparison is central to the answer and can be clearly represented as a simple bar chart, respond ONLY with a JSON object adhering to this exact structure:
    \`\`\`json
    {
      "graphData": {
        "type": "bar",
        "data": [ { "categoryKeyName": "Label1", "dataKeyName": value1 }, { "categoryKeyName": "Label2", "dataKeyName": value2 }, ... ],
        "categoryKey": "categoryKeyName",
        "dataKey": "dataKeyName"
      }
    }
    \`\`\`
    Replace 'categoryKeyName' and 'dataKeyName' with appropriate labels derived from the data (e.g., "month", "sales"). Use "bar" for the type. Do NOT include any text outside this JSON structure when providing graph data.
`;

// --- Agent Configuration ---
export const createAgentConfig = () => {
  const baseConfig = {
    api: {
      model: "gemini-2.0-flash", // Consistent model, updated from 2.0
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
      // Add other tiers if needed
    },
  };

  const techGenieConfig = {
    ...baseConfig,
    key: "tech", // Used by UI for selection
    id: "tech-genie", // Used internally, e.g., by hooks
    deepResearch: true,
    name: "Tech Genie",
    emoji: '🤖',
    icon: faRobot,
    capabilities: { voice: true, attachments: true, canvas: false, math: false },
    vapiAssistantId: "5a9be56c-a464-4ccb-acef-c5c49fce3a6c",
    initialPrompt: `You are TechGenie, an expert computer technology consultant, programmer, and web developer. Your tone is helpful, informative, and slightly enthusiastic about technology. Provide clear explanations, code examples when relevant, and practical advice. Assume the user has some technical understanding but avoid overly obscure jargon unless necessary, explaining it if used.
    ${OUTPUT_FORMATTING_RULES_BASE}`,
    initialResponse: "Hello! I'm TechGenie, your expert tech consultant. Ask me anything about coding, web development, hardware, or software!",
    placeholders: {
      input: "Ask Tech Genie about code, APIs, hardware...",
      noCredits: "Upgrade to continue asking questions!",
    },
    suggestions: [
      "Explain the difference between REST and GraphQL.",
      "How do I set up a simple Node.js server?",
      "Write a Python function to read a CSV file.",
      "Compare React Native vs Flutter."
    ],
    themes: { dark: {}, light: {} }, // Define theme properties if needed
    defaultTheme: "dark",
    interactionName: "Questions",
    actions: { copyCode: { icon: faClipboard, label: "Copy code" } },
    ui: { containerClass: "tech-chat-container" }
  };

  const bishopAiConfig = {
    ...baseConfig,
    key: "bishop", // Used by UI for selection
    id: "bishop-ai", // Used internally
    deepResearch: false, // Adjusted based on suggestion
    name: "Bishop AI",
    emoji: '📖',
    icon: faBookBible,
    capabilities: { voice: false, attachments: false, canvas: false, math: false },
    initialPrompt: `You are Bishop AI, a compassionate, wise, and insightful guide based on the teachings of the King James Version (KJV) Bible. Your purpose is to offer spiritual guidance, interpretation of scripture, and thoughtful reflection on biblical principles. Respond with kindness, clarity, and reverence, always referencing the KJV Bible where appropriate. Avoid giving personal opinions as fact; instead, frame responses based on biblical text and common interpretations.
    ${OUTPUT_FORMATTING_RULES_BASE}`,
    initialResponse: "Peace be with you. I am Bishop AI, here to offer guidance and reflection based on the King James Version Bible. How may I assist your spiritual journey today?",
    placeholders: {
      input: "Seek wisdom or scripture (KJV)...",
      noCredits: "Further consultation requires deepening your commitment.",
    },
    suggestions: [
        "Explain the parable of the Good Samaritan.",
        "What does the KJV Bible say about faith?",
        "Share verses about hope in difficult times.",
        "Who were the apostles?"
    ],
    themes: { calm: {}, dark: {} }, // Define theme properties if needed
    defaultTheme: "calm",
    interactionName: "Consultations",
    actions: { saveToJournal: { icon: faSave, label: "Copy Scripture/Guidance" } },
    ui: { containerClass: "bishop-chat-container" }
  };

  const professorAiConfig = {
    ...baseConfig,
    api: { // Professor uses the Pro model
      ...baseConfig.api,
      model: 'gemini-2.0-flash',
      imageModel: "gemini-pro-vision"
    },
    key: "stem", // Used by UI for selection
    id: "professor-ai", // Used internally
    deepResearch: true,
    name: "Professor AI",
    emoji: '🔬',
    icon: faFlask,
    capabilities: { voice: false, attachments: true, canvas: true, math: true },
    initialPrompt: `You are Professor AI, a knowledgeable, patient, and engaging STEM tutor. Explain concepts clearly, break down complex problems step-by-step, and provide examples. Use analogies where helpful. Your expertise covers Science, Technology, Engineering, and Mathematics.
    ${OUTPUT_FORMATTING_RULES_BASE}
    ${OUTPUT_FORMATTING_RULES_GRAPH}`, // Includes graph rules
    initialResponse: "Hello! I'm Professor AI. Ready to explore the wonders of STEM? Ask me a question, describe a diagram, or request a data visualization!",
    placeholders: {
      input: "Ask a STEM question or request a visualization...",
      noCredits: "Upgrade for unlimited STEM help!",
    },
    suggestions: [
        "Explain Newton's laws of motion.",
        "How does DNA replication work?",
        "Calculate the area of a circle with radius 5.",
        "Visualize the following data: [Data: Apples=5, Bananas=8, Oranges=3]"
    ],
    themes: { light: {}, dark: {} }, // Define theme properties if needed
    defaultTheme: "light",
    interactionName: "Lessons",
    actions: { copyCode: { icon: faClipboard, label: "Copy explanation/formula" } },
    ui: { containerClass: "stem-chat-container" }
  };

  // --- Map Configurations by ID (for internal lookup) ---
  agentConfigMap[techGenieConfig.id] = techGenieConfig;
  agentConfigMap[bishopAiConfig.id] = bishopAiConfig;
  agentConfigMap[professorAiConfig.id] = professorAiConfig;

  // --- Exported Functions ---
  return {
    /**
     * Retrieves agent configuration by its unique ID (e.g., 'tech-genie').
     * @param {string} id - The agent ID.
     * @returns {object | null} The agent config or null if not found.
     */
    getById: (id) => agentConfigMap[id] || null,

    /**
     * Retrieves all agent configurations as an array.
     * @returns {object[]} An array of all agent config objects.
     */
    getAllConfigs: () => Object.values(agentConfigMap),

    /**
     * Retrieves all agent configurations as an object keyed by their UI key (e.g., 'tech', 'bishop').
     * @returns {object} An object where keys are agent keys and values are agent configs.
     */
    getAllAsObject: () => {
      // Use the UI key ('tech', 'bishop', 'stem') as the key in the returned object
      return Object.values(agentConfigMap).reduce((acc, config) => {
        // --- THIS LINE IS CORRECTED ---
        acc[config.key] = config; // Map by KEY ('tech', 'bishop', 'stem')
        // --- END CORRECTION ---
        return acc;
      }, {});
    }
  };
};

// --- Export the created config object ---
export const agentConfig = createAgentConfig();

// Optional: Add helper functions if needed, e.g.,
// export const hasAgent = (id) => !!agentConfigMap[id];
// export const getByMode = (mode) => Object.values(agentConfigMap).find(c => c.key === mode);