import { agentConfig } from '../config/agent-config';

describe('ChatInterface dependencies', () => {
  it('agent config provides getAll method', () => {
    const agents = agentConfig.getAll();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it('each agent has required display properties', () => {
    const agents = agentConfig.getAll();
    agents.forEach(agent => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.emoji).toBeDefined();
    });
  });

  it('agent config provides getById method', () => {
    const agent = agentConfig.getById('tech-genie');
    expect(agent).toBeDefined();
    expect(agent.name).toBe('Tech Genie');
  });
});
