import React, { useState } from 'react';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import './Projects.css';

function Projects() {
  const [expanded, setExpanded] = useState(null);

  const projects = [
    {
      title: 'Lattice OS',
      tag: 'Founder · Flagship',
      description:
        'A sovereign AI platform — web SaaS and native desktop — with Zero-Trust identity, edge telemetry, and agentic workflows built in from the ground up.',
      timeline: '2025 — Present',
      technologies: 'Next.js · Go · Rust · Electron/Tauri · Firebase · Vercel',
      review:
        'Led the full-stack transition to a native desktop app, shipped an enterprise CI/CD pipeline, and built real-time agentic streaming infrastructure.',
      github: 'https://github.com/invidias-codem/ai-saas',
      demo: 'https://gen1e.xyz',
    },
    {
      title: 'AI SaaS Platform',
      tag: 'Full-Stack',
      description:
        'An end-to-end generative AI platform producing images, code, video, and conversation from prompts, with secure multi-feature access control.',
      timeline: '2024 — Present',
      technologies: 'Next.js · TypeScript · Firebase · Clerk Auth · Leading LLM & media APIs',
      review: 'Deployed end-to-end with CI/CD for high availability and secure authentication.',
      github: 'https://github.com/invidias-codem/ai-saas',
      demo: 'https://gen1e.xyz',
    },
    {
      title: 'TradeFlow',
      tag: 'Product',
      description:
        'A field-operations tool for trades businesses: jobs, invoices, estimates, and inventory — with AI-assisted estimating.',
      timeline: '2024 — Present',
      technologies: 'React · Node.js · REST APIs',
      review: 'Built to cut administrative overhead for small service businesses.',
      demo: 'https://tradeflow-2m4t.onrender.com',
    },
    {
      title: 'Legend Biotech — Scheduling Automation',
      tag: 'Integration',
      description:
        'An API-driven scheduling system using Microsoft Power Apps and AI automation to eliminate administrative bottlenecks.',
      timeline: '2024',
      technologies: 'Microsoft Power Apps · API Automation',
      review: 'Improved scheduling efficiency across cross-functional lab teams.',
    },
    {
      title: 'FinTech Demo',
      tag: 'Demo',
      description:
        'A modern banking-platform demo showcasing secure authentication and transfer flows, with plans for AI-driven financial insights.',
      timeline: 'Ongoing',
      technologies: 'Next.js · Tailwind CSS · Plaid · Appwrite',
      review: 'Demonstrates modern FinTech UI/UX and secure auth patterns.',
      demo: 'https://baroque-banking.vercel.app/sign-in',
    },
    {
      title: 'Halal King Soap — E-commerce',
      tag: 'Freelance',
      description:
        'A storefront engagement: UX, payments, and mobile responsiveness to improve brand visibility and conversion.',
      timeline: '2023',
      technologies: 'Web · UI/UX',
      review: 'Collaborated directly with the founder to refine branding and digital presence.',
    },
  ];

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <section className="projects jj-container">
      <header className="jj-section-head">
        <p className="eyebrow">Selected Work</p>
        <h1 className="jj-section-title">Projects</h1>
        <p className="jj-section-sub">
          A range of builds — from a sovereign AI platform to field-ops tooling and client work.
        </p>
      </header>

      <div className="jj-grid jj-grid-2 projects-grid">
        {projects.map((p, i) => (
          <article key={p.title} className={`jj-card project-card ${expanded === i ? 'expanded' : ''}`}>
            {p.tag && <span className="jj-pill project-tag">{p.tag}</span>}
            <h3 className="project-title">{p.title}</h3>
            <p className="project-desc">{p.description}</p>
            <button
              className="jj-btn jj-btn-quiet project-toggle"
              onClick={() => toggle(i)}
              aria-expanded={expanded === i}
            >
              {expanded === i ? 'Read Less' : 'Read More'}
            </button>

            {expanded === i && (
              <div className="project-details">
                <p><span className="detail-label">Timeline:</span> <span className="detail-content">{p.timeline}</span></p>
                <p><span className="detail-label">Stack:</span> <span className="detail-content">{p.technologies}</span></p>
                <p><span className="detail-label">Notes:</span> <span className="detail-content">{p.review}</span></p>
                <div className="project-links">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-ghost">
                      <FaGithub /> GitHub
                    </a>
                  )}
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-quiet">
                      <FaExternalLinkAlt /> Live
                    </a>
                  )}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default Projects;
