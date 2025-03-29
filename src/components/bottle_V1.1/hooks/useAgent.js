import { useState, useEffect, useMemo, useCallback } from 'react';
import { agentConfig } from './agent-config';
import useChatLogic from './useChatLogic';

/**
 * Custom hook that provides agent-specific functionality based on mode and subscription
 * 
 * @param {Object} options Configuration options
 * @param {string} options.mode - Either "tech" or "wellness"
 * @param {string} options.subscription - User's subscription tier
 * @param {boolean} options.apiEnabled - Whether API access is enabled
 * @returns {Object} Agent-specific configuration and chat functionality
 */
const useAgent = ({ 
  mode = "tech", 
  subscription = "free",
  apiEnabled = false
}) => {
  // Get the appropriate agent configuration based on mode
  const config = useMemo(() => {
    return mode === "tech" ? agentConfig.techGenie : agentConfig.mindfulMate;
  }, [mode]);
  
  // Get subscription tier configuration
  const tierConfig = useMemo(() => {
    return config.subscription[subscription] || config.subscription.free;
  }, [config, subscription]);
  
  // Current theme state
  const [theme, setTheme] = useState(config.defaultTheme);
  
  // Memoize current theme colors
  const themeColors = useMemo(() => {
    return config.themes[theme];
  }, [config, theme]);
  
  // Toggle between available themes
  const toggleTheme = useCallback(() => {
    const themes = Object.keys(config.themes);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [config, theme]);
  
  // Parse initial prompt with subscription-specific enhancements
  const enhancedPrompt = useMemo(() => {
    return `${config.initialPrompt} Provide ${tierConfig.responseQuality} responses with ${tierConfig.responseTime} response time.`;
  }, [config.initialPrompt, tierConfig]);
  
  // Use the chat logic hook with agent-specific configuration
  const chatLogic = useChatLogic({
    mode,
    initialPrompt: enhancedPrompt,
    initialResponse: config.initialResponse,
    subscription,
    maxInteractions: tierConfig.dailyInteractions,
    onSubscriptionEnded: () => {
      console.log(`${config.name} subscription interactions ended`);
    }
  });
  
  // Check if user can access a specific premium feature
  const canAccessFeature = useCallback((featureKey) => {
    const feature = config.premiumFeatures[featureKey];
    if (!feature) return false;
    
    const tierLevels = {
      "free": 0,
      "basic": 1,
      "pro": 2,
      "premium": 3
    };
    
    const featureTierLevel = tierLevels[feature.tier] || 4;
    const userTierLevel = tierLevels[subscription] || 0;
    
    return userTierLevel >= featureTierLevel;
  }, [config, subscription]);
  
  // Get available premium features for current subscription
  const availableFeatures = useMemo(() => {
    return Object.keys(config.premiumFeatures).filter(canAccessFeature);
  }, [config, canAccessFeature]);
  
  // Get API configuration if user has API access
  const apiConfig = useMemo(() => {
    if (!canAccessFeature('apiAccess') || !apiEnabled) {
      return null;
    }
    
    const feature = config.premiumFeatures.apiAccess;
    return {
      ...feature,
      quota: tierConfig.apiQuota || 0,
      baseUrl: `/api/${mode}`,
      endpoints: feature.endpoints,
    };
  }, [canAccessFeature, config, mode, tierConfig, apiEnabled]);
  
  // Memoize custom prompt templates if available
  const customPromptTemplates = useMemo(() => {
    if (!canAccessFeature('customPrompts')) {
      return [];
    }
    return config.premiumFeatures.customPrompts.templates || [];
  }, [canAccessFeature, config]);
  
  // Generate suggested questions based on expertise
  const suggestedQuestions = useMemo(() => {
    const questions = [];
    config.expertise.forEach(category => {
      if (category.sampleQuestions && category.sampleQuestions.length) {
        // Randomly select one question from each expertise category
        const randomIndex = Math.floor(Math.random() * category.sampleQuestions.length);
        questions.push({
          text: category.sampleQuestions[randomIndex],
          category: category.name
        });
      }
    });
    return questions;
  }, [config]);
  
  // Track analytics if permitted (simulated)
  useEffect(() => {
    // In a real app, this would send analytics to your backend
    const trackSession = async () => {
      try {
        console.log(`Tracking session for ${config.name}, tier: ${subscription}`);
        // Track agent usage statistics
      } catch (error) {
        console.error('Failed to track analytics:', error);
      }
    };
    
    trackSession();
  }, [config, subscription]);

  return {
    // Base configuration
    config,
    subscription: tierConfig,
    
    // UI and theming
    theme,
    themeColors,
    toggleTheme,
    
    // Chat functionality
    ...chatLogic,
    
    // Premium features access
    canAccessFeature,
    availableFeatures,
    apiConfig,
    customPromptTemplates,
    suggestedQuestions,
    
    // Helper functions
    getFeatureConfig: (featureKey) => config.premiumFeatures[featureKey],
    formatInteractionName: (count) => `${count} ${count === 1 ? config.interactionName.slice(0, -1) : config.interactionName}`
  };
};

export default useAgent;