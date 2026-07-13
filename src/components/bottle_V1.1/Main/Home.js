// src/components/bottle_V1.1/Main/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faRobot, faShieldHalved, faProjectDiagram,
  faAddressCard, faEnvelope, faCogs, faUser
} from '@fortawesome/free-solid-svg-icons';
import './Home.css';

// Explore modules (secondary grid) — trimmed to live routes
const BENTO_MODULES = [
  {
    id: 'projects',
    area: 'projects',
    title: 'Project Logs',
    icon: faCode,
    link: '/projects',
    cta: 'View All >',
    subItems: [
      { title: 'Lattice OS', icon: faShieldHalved },
      { title: 'AI SaaS', icon: faRobot },
      { title: 'TradeFlow', icon: faProjectDiagram },
    ],
    size: 'large',
  },
  { id: 'skills', area: 'skills', title: 'Skills Matrix', icon: faCogs, link: '/skills', cta: 'Explore >', size: 'small' },
  { id: 'about', area: 'about', title: 'Profile', icon: faUser, link: '/about', cta: 'Bio >', size: 'small' },
  { id: 'contact', area: 'contact', title: 'Contact', icon: faEnvelope, link: '/contact', cta: 'Send Msg >', size: 'medium' },
];

function Home() {
  const BentoBox = ({ module }) => {
    const isExternalLink = module.link && (module.link.startsWith('http://') || module.link.startsWith('https://'));
    return (
      <div className={`bento-box ${module.area} size-${module.size}`}>
        {module.icon && <FontAwesomeIcon icon={module.icon} className="box-icon" />}
        <h3 className="box-title">{module.title}</h3>
        {module.subItems && (
          <ul className="box-subitems">
            {module.subItems.map((item, index) => (
              <li key={index}>
                {item.icon && <FontAwesomeIcon icon={item.icon} className="subitem-icon" />} {item.title}
              </li>
            ))}
          </ul>
        )}
        {module.link && module.cta && (
          isExternalLink ? (
            <a href={module.link} className="box-cta" target="_blank" rel="noopener noreferrer">{module.cta}</a>
          ) : (
            <Link to={module.link} className="box-cta">{module.cta}</Link>
          )
        )}
      </div>
    );
  };

  return (
    <div className="home-bento-container">
      {/* HERO — hybrid: modern pro base + subtle CRT accent */}
      <section className="jj-hero crt-hero" aria-label="Introduction">
        <div className="jj-container jj-hero-inner">
          <p className="eyebrow">DevSecOps &amp; AI Infrastructure</p>
          <h1 className="jj-hero-title">
            I build sovereign, secure AI<br />infrastructure that ships.
          </h1>
          <p className="jj-hero-sub">
            Joshua-Jair “JJ” Mohammed — Founder of <strong>Lattice OS</strong>. From Zero-Trust
            architectures to agentic systems, I engineer the trustworthy layer for intelligent software.
          </p>
          <div className="jj-hero-actions">
            <Link to="/chat" className="jj-btn jj-btn-primary">Try the Agent</Link>
            <Link to="/projects" className="jj-btn jj-btn-ghost">View Work</Link>
          </div>
          <ul className="jj-hero-tags" aria-label="Focus areas">
            <li className="jj-pill">Zero-Trust Security</li>
            <li className="jj-pill">Agentic AI Platforms</li>
            <li className="jj-pill">CI/CD &amp; Cloud</li>
            <li className="jj-pill">Full-Stack (Go · Rust · Next.js)</li>
          </ul>
        </div>
      </section>

      {/* EXPLORE — restyled bento grid */}
      <section className="jj-container jj-explore">
        <div className="jj-section-head">
          <p className="eyebrow">Explore</p>
          <h2 className="jj-section-title">Selected work &amp; capabilities</h2>
        </div>
        <div className="bento-grid">
          {BENTO_MODULES.map((module) => (
            <BentoBox key={module.id} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
