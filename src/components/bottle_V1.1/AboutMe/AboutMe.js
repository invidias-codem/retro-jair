import React from 'react';
import { FaUser, FaLinkedin, FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './AboutMe.css';

const TIMELINE = [
  {
    role: 'Lead DevSecOps & AI Infrastructure Engineer',
    org: 'Lattice OS / FluxTrust LLC',
    period: '2025 — Present',
    note: 'Founder. Architected a sovereign AI platform (web SaaS + native desktop) with Zero-Trust identity, edge telemetry, and agentic workflows.',
  },
  {
    role: 'Operations Associate',
    org: 'Legend Biotech',
    period: 'Sep 2024 — Feb 2025',
    note: 'API integration & M365 Enterprise upgrades; scheduling automation across lab teams.',
  },
  {
    role: 'Software Developer Intern',
    org: 'Code Differently',
    period: 'Sep 2023 — Feb 2024',
    note: 'REST APIs (Java Spring Boot) + React front-ends for virtual learning environments.',
  },
  {
    role: 'Network Technician',
    org: "Bally's Dover Resort & Casino",
    period: 'Jan 2023 — Sep 2023',
    note: 'Network security controls, firewall/switch hardening, root-cause analysis across 500+ endpoints.',
  },
  {
    role: 'Help Desk Support',
    org: 'Intelliblue LLC',
    period: 'Jul 2022 — Jan 2023',
    note: 'Tier-1/2 support, AD administration, endpoint protection & patch management.',
  },
];

function AboutMe() {
  return (
    <div className="about-me-container jj-container">
      <header className="jj-section-head about-head">
        <p className="eyebrow">About</p>
        <h1 className="jj-section-title">Joshua-Jair “JJ” Mohammed</h1>
        <p className="jj-section-sub">
          DevSecOps &amp; AI Infrastructure Engineer. I build the trustworthy layer for intelligent
          software — where security and autonomy aren’t afterthoughts, they’re the foundation.
        </p>
      </header>

      <div className="about-bio jj-card">
        <p>
          I’m the founder of <strong>Lattice OS</strong> (formerly Tech Genie), a sovereign AI
          platform that runs as both a web SaaS and a native desktop app — with Zero-Trust identity,
          real-time telemetry, and agentic workflows built in from day one.
        </p>
        <p>
          My background spans the full stack of trust: network security and hardening at scale,
          enterprise CI/CD and cloud architecture (GitHub Actions, Vercel, Firebase), and hands-on
          full-stack product engineering in Go, Rust, Next.js, and Node. I’m equally at home in a
          SIEM dashboard, a Rust service, or a React component.
        </p>
        <p>
          I care about the part of AI most teams skip: the substrate. Identity, access control,
          audit trails, and graceful failure — so the systems we ship are ones people can actually rely on.
        </p>
        <div className="about-social">
          <a href="https://www.linkedin.com/in/joshua-mohammed14/" target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-quiet" aria-label="LinkedIn">
            <FaLinkedin /> LinkedIn
          </a>
          <a href="https://github.com/invidias-codem" target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-quiet" aria-label="GitHub">
            <FaGithub /> GitHub
          </a>
          <Link to="/contact" className="jj-btn jj-btn-primary">Book a Consultation</Link>
        </div>
      </div>

      <section className="about-timeline" aria-label="Experience">
        <h2 className="jj-section-title about-timeline-title">Experience</h2>
        <ol className="timeline-list">
          {TIMELINE.map((t) => (
            <li key={t.role + t.org} className="timeline-item jj-card">
              <div className="timeline-role">{t.role}</div>
              <div className="timeline-org">{t.org}</div>
              <div className="timeline-period jj-pill">{t.period}</div>
              <p className="timeline-note">{t.note}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default AboutMe;
