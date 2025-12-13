import { agentConfig } from './agent-config';

describe('agentConfig', () => {
  it('returns all agents', () => {
    const agents = agentConfig.getAll();
    expect(agents.length).toBe(3);
  });

  it('gets agent by id', () => {
    const agent = agentConfig.getById('tech-genie');
    expect(agent).toBeDefined();
    expect(agent.name).toBe('Tech Genie');
  });

  it('checks if agent exists', () => {
    expect(agentConfig.hasAgent('tech-genie')).toBe(true);
    expect(agentConfig.hasAgent('nonexistent')).toBe(false);
  });

  it('gets agent by mode', () => {
    const agent = agentConfig.getByMode('bishop');
    expect(agent).toBeDefined();
    expect(agent.id).toBe('bishop-ai');
  });

  it('each agent has required properties', () => {
    const agents = agentConfig.getAll();
    agents.forEach(agent => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.emoji).toBeDefined();
      expect(agent.initialPrompt).toBeDefined();
      expect(agent.initialResponse).toBeDefined();
    });
  });
});
