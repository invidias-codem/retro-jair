// Skills.js — professional skills matrix (replaces the legacy "skill game")
import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaCode, FaRobot, FaLock } from 'react-icons/fa';
import './Skills.css';

const PILLARS = [
  {
    icon: FaShieldAlt,
    title: 'Secure Infrastructure & DevSecOps',
    items: ['Zero-Trust Architecture', 'SIEM & threat monitoring', 'CI/CD (GitHub Actions, Vercel)', 'Server & endpoint hardening', 'Vulnerability scanning'],
  },
  {
    icon: FaCode,
    title: 'Full-Stack & Product Engineering',
    items: ['Next.js & React', 'Node.js', 'Go & Rust', 'Electron / Tauri', 'Java Spring Boot · Microservices · REST'],
  },
  {
    icon: FaRobot,
    title: 'Agentic AI & Platform Architecture',
    items: ['Lattice OS orchestration', 'Real-time streaming infra', 'Telemetry & audit frameworks', 'LLM routing (Claude/Gemini/OpenAI)', 'Tauri desktop delivery'],
  },
  {
    icon: FaLock,
    title: 'Cybersecurity & Compliance',
    items: ['Network security & firewalls', 'Endpoint protection & patch mgmt', 'GMP-regulated environments', 'Active Directory', 'Incident root-cause analysis'],
  },
];

function Skills() {
  return (
    <section className="skills jj-container">
      <header className="jj-section-head">
        <p className="eyebrow">Capabilities</p>
        <h1 className="jj-section-title">Skills Matrix</h1>
        <p className="jj-section-sub">
          The disciplines behind the work — security-first, full-stack, and AI-native.
        </p>
      </header>

      <div className="jj-grid jj-grid-2 skills-grid">
        {PILLARS.map((p) => (
          <article key={p.title} className="jj-card skill-pillar">
            <div className="skill-pillar-head">
              <span className="skill-pillar-icon"><p.icon /></span>
              <h3 className="skill-pillar-title">{p.title}</h3>
            </div>
            <ul className="skill-list">
              {p.items.map((it) => (
                <li key={it} className="skill-item">{it}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="skills-cta">
        <Link to="/projects" className="jj-btn jj-btn-primary">See it applied in Projects</Link>
      </div>
    </section>
  );
}

export default Skills;
