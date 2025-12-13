
import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './AI_components/ChatInterface';
import { agentConfig } from './config/agent-config';
import AgentSelection from './AI_components/AgentSelection';

const Google = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('tech-genie'); // Default agent
  const [isAgentView, setIsAgentView] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showResults && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showResults]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === '') return;

    setIsLoading(true);
    // Simulate a search delay
    setTimeout(() => {
      setShowResults(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleLuckyClick = () => {
    setIsAgentView(true);
    setShowResults(true);
  };

  const handleAgentSelect = (agentId) => {
    console.log('Selected agent:', agentId); // Debug log
    setSelectedAgentId(agentId);
    setIsAgentView(true);
    setShowResults(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      );
    }

    if (isAgentView && selectedAgentId) {
      console.log('Rendering ChatInterface with agentId:', selectedAgentId); // Debug log
      return <ChatInterface agentId={selectedAgentId} />;
    }

    if (showResults) {
      return (
        <div>
          <h2 className="text-xl mb-4">Search Results for "{searchTerm}"</h2>
          {/* Future search results would go here */}
        </div>
      );
    }

    return (
      <div className="text-center">
        <h1 className="text-8xl font-google mb-8">Bottle</h1>
        <form onSubmit={handleSearch} className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-lg mx-auto bg-app border border-brand-line rounded-full px-6 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-accent"
            placeholder="Search or ask a question..."
          />
          <div className="mt-8 space-x-4">
            <button type="submit" className="btn-google">Bottle Search</button>
            <button type="button" onClick={handleLuckyClick} className="btn-google">I'm Feeling Lucky</button>
          </div>
        </form>
      </div>
    );
  };

  // Get all agents from config
  const allAgents = agentConfig.getAll ? agentConfig.getAll() : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app text-text-main p-4">
      <div className="w-full max-w-4xl">
        {showResults && allAgents.length > 0 && (
          <div className="mb-4">
            <AgentSelection
              agents={allAgents}
              selectedAgentId={selectedAgentId}
              onSelect={handleAgentSelect}
            />
          </div>
        )}
        <div className={`transition-all duration-500 ${showResults ? 'h-[70vh]' : 'h-auto'}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Google;
