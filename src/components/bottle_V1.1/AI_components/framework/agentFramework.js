/*
  Agent Framework (Optimized)
  - AgentSessionProvider: Manages per-agent session state (messages, drafts) and persists it to localStorage.
  - Unified Adapter Factory: A single function to create communication adapters for all agents.
  - Centralized API Service: A lazy-loaded service to manage the Gemini API connection efficiently.
*/

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { agentConfig as allAgentConfigs } from '../../config/agent-config';
import { startChatSession, generateImage } from '../../api'; // Using the actual API functions
import { SearchTool } from '../../tools/searchTool';
import { WebFetchTool } from '../../tools/webFetch';
import { IntegrationTool } from '../../tools/integrationTool';
import { runToolOrchestration } from '../../tools/toolOrchestrator';

// --- Message Normalization Utilities ---
export const MessageRoles = {
  USER: 'user',
  MODEL: 'model',
  SYSTEM: 'system',
};

export function normalizeMessage(input) {
  if (!input || typeof input !== 'object') return null;
  const role = input.role || MessageRoles.MODEL;
  const text = typeof input.text === 'string' ? input.text : '';
  const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl : undefined;
  const type = input.type || (imageUrl ? 'image_response' : 'text');
  const timestamp = input.timestamp || Date.now();
  return { role, text, imageUrl, type, timestamp };
}

export function clampMessages(messages, max = 200) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-max);
}

// --- Agent Session Context ---
const STORAGE_KEY = 'agentSessions_v1';
const initialSessionState = {
    messages: [],
    draft: '',
    tools: {
        attachment: null, // { name, type, dataBase64 }
        canvas: null,
        isCanvasOpen: false,
    }
};

const AgentSessionContext = createContext(undefined);

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('AgentSession: failed to load from storage', e);
    return {};
  }
}

function safeSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('AgentSession: failed to save to storage', e);
  }
}

export function AgentSessionProvider({ children, initialAgents = ['tech', 'stem', 'bishop'] }) {
  const [sessions, setSessions] = useState(() => {
    const loaded = safeLoad();
    initialAgents.forEach((id) => {
      if (!loaded[id]) {
        loaded[id] = { ...initialSessionState };
      }
    });
    return loaded;
  });

  useEffect(() => {
    safeSave(sessions);
  }, [sessions]);

  const updateSession = useCallback((agentId, newProps) => {
    setSessions(prev => ({
        ...prev,
        [agentId]: { ...(prev[agentId] || initialSessionState), ...newProps },
    }));
  }, []);

  const addMessage = useCallback((agentId, msg) => {
    const normalized = normalizeMessage(msg);
    if (!normalized) return;
    setSessions((prev) => {
      const current = prev[agentId] || { ...initialSessionState };
      const nextMessages = clampMessages([...(current.messages || []), normalized]);
      return { ...prev, [agentId]: { ...current, messages: nextMessages } };
    });
  }, []);

  const value = useMemo(() => ({
    sessions,
    updateSession,
    addMessage,
  }), [sessions, updateSession, addMessage]);

  return (
    <AgentSessionContext.Provider value={value}>
      {children}
    </AgentSessionContext.Provider>
  );
}

export function useAgentSessions() {
  const ctx = useContext(AgentSessionContext);
  if (!ctx) throw new Error('useAgentSessions must be used within AgentSessionProvider');
  return ctx;
}

// --- Unified Adapter Factory ---

/**
 * Creates a communication adapter for a specific agent.
 * @param {string} agentId - The ID of the agent (e.g., 'tech-genie', 'professor-ai').
 * @returns {object} An adapter object with initialize, sendMessage, and teardown methods.
 */
export function createAgentAdapter(agentId) {
    const config = allAgentConfigs.getById(agentId);
    if (!config) {
        throw new Error(`Configuration for agent "${agentId}" not found.`);
    }

    let chat = null;
    let isInitialized = false;

    // Robust message sending logic for all Gemini-based text agents
    async function sendGeminiMessage(parts = []) {
        if (!isInitialized || !chat) throw new Error('Adapter not initialized.');
        
        const result = await chat.sendMessage(parts);
        const response = result.response;

        try {
            const text = response.text();
            if (text) return { text };
        } catch (e) {
            console.warn("Simple text extraction failed, trying manual parsing.", e);
        }

        if (response.candidates?.[0]?.content?.parts) {
            const textContent = response.candidates[0].content.parts
                .map(part => part.text)
                .filter(Boolean)
                .join("\n\n");
            if (textContent) return { text: textContent };
        }

        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request blocked for safety: ${response.promptFeedback.blockReason}`);
        }

        throw new Error("The AI returned an empty or unreadable response.");
    }

    // --- Base Adapter Definition ---
    const adapter = {
        id: agentId,
        config,

        async initialize() {
            if (isInitialized) return;
            chat = await startChatSession(config);
            isInitialized = true;
        },

        async sendMessage(parts = []) {
            const hasTools = !!(config.tools?.search || config.tools?.webFetch);

            if (hasTools) {
                const llmSend = async (contextMessages) => {
                    const text = contextMessages.map(m => m.text).join('\n\n');
                    return sendGeminiMessage([{ text }]);
                };

                const tools = {
                    searchTool: config.tools?.search ? new SearchTool({}) : null,
                    webFetchTool: config.tools?.webFetch ? new WebFetchTool({}) : null,
                };

                const { text } = await runToolOrchestration({
                    llmSend,
                    tools,
                    config,
                    userText: parts.filter(p => p.text).map(p => p.text).join(' '),
                });

                // Preserve Professor AI image generation behavior
                if (agentId === 'professor-ai') {
                    const textInput = parts.filter(p => p.text).map(p => p.text).join(' ');
                    const wantsImage = config.api.imageModel
                        && ['draw', 'diagram', 'sketch', 'illustrate', 'visualize'].some(k => textInput.toLowerCase().includes(k));
                    let imageUrl = null;
                    if (wantsImage) {
                        try { imageUrl = await generateImage(textInput, config.api.imageModel); } catch (_) {}
                    }
                    return { text, imageUrl };
                }

                return { text };
            }

            // Default behavior when tools are disabled
            if (agentId === 'tech-genie' || agentId === 'bishop-ai') {
                return sendGeminiMessage(parts);
            }

            if (agentId === 'professor-ai') {
                const textInput = parts.filter(p => p.text).map(p => p.text).join(' ');
                const wantsImage = config.api.imageModel
                    && ['draw', 'diagram', 'sketch', 'illustrate', 'visualize'].some(k => textInput.toLowerCase().includes(k));
                let imageUrl = null;
                if (wantsImage) {
                    try { imageUrl = await generateImage(textInput, config.api.imageModel); } catch (_) {}
                }
                const textResponse = await sendGeminiMessage(parts);
                return { ...textResponse, imageUrl };
            }

            return sendGeminiMessage(parts);
        },

        async teardown() {
            chat = null;
            isInitialized = false;
        }
    };

    return adapter;
}