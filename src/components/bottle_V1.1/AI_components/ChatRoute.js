import React from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from './ChatInterface';

// Wrapper route that ensures ChatInterface always receives a valid agentId.
// Falls back to 'tech-genie' when no :agentId param is provided.
const ChatRoute = () => {
  const { agentId } = useParams();
  const effectiveAgentId = agentId || 'tech-genie';
  return <ChatInterface agentId={effectiveAgentId} />;
};

export default ChatRoute;
