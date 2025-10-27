// src/components/bottle_V1.1/Main/Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faRobot, faFlask, faBookBible, faProjectDiagram,
  faAddressCard, faEnvelope, faCogs, faUser, faClipboard, faTerminal
} from '@fortawesome/free-solid-svg-icons';
import Speaker from './Speaker'; // Keep the speaker for top banner effect
import './Home.css'; 

// Define Modules for the Bento Grid
const BENTO_MODULES = [
  { 
    id: 'welcome', 
    area: 'welcome', 
    title: 'Jairs.Portfolio v1.1', 
    subtitle: 'A custom built web app', 
    content: 'Feel free to explore and learn more about me.', 
    size: 'large' 
  },
  { 
    id: 'ai-nexus', 
    area: 'ai', 
    title: 'AI Nexus', 
    icon: faRobot, 
    link: '/chat', 
    cta: 'Access Agents >',
    subItems: [
        { title: 'Tech Genie', icon: faCode },
        { title: 'Professor AI', icon: faFlask },
        { title: 'Bishop AI', icon: faBookBible },
    ],
    size: 'large' 
  },
  { 
    id: 'projects', 
    area: 'projects', 
    title: 'Project Logs', 
    icon: faProjectDiagram, 
    link: '/projects', 
    cta: 'View All >',
    subItems: [
        { title: 'AI SaaS', icon: faCode },
        { title: 'FinTech Demo', icon: faAddressCard },
    ],
    size: 'medium' 
  },
  { 
    id: 'skills', 
    area: 'skills', 
    title: 'Skills Matrix', 
    icon: faCogs, 
    link: '/skills', 
    cta: 'Engage Game >',
    size: 'small' 
  },
  { 
    id: 'terminal', 
    area: 'terminal', 
    title: 'Terminal', 
    icon: faTerminal, 
    link: '/terminal', 
    cta: 'Access Logs >',
    size: 'small' 
  },
  { 
    id: 'about', 
    area: 'about', 
    title: 'User Profile', 
    icon: faUser, 
    link: '/about', 
    cta: 'View Bio >',
    size: 'small' 
  },
   { 
    id: 'services', 
    area: 'services', 
    title: 'Services', 
    icon: faClipboard, 
    link: '/services', 
    cta: 'Consult >',
    size: 'small' 
  },
  { 
    id: 'contact', 
    area: 'contact', 
    title: 'Contact', 
    icon: faEnvelope, 
    link: '/contact', 
    cta: 'Send Msg >',
    size: 'medium' 
  },
];

function Home() {

  // Component for rendering individual bento boxes
  const BentoBox = ({ module }) => (
    <div className={`bento-box ${module.area} size-${module.size}`}>
      {module.icon && <FontAwesomeIcon icon={module.icon} className="box-icon" />}
      <h3 className="box-title">{module.title}</h3>
      {module.subtitle && <p className="box-subtitle">{module.subtitle}</p>}
      {module.content && <p className="box-content">{module.content}</p>}
      
      {/* Render Sub-items if they exist */}
      {module.subItems && (
          <ul className="box-subitems">
              {module.subItems.map((item, index) => (
                  <li key={index}>
                      {item.icon && <FontAwesomeIcon icon={item.icon} className="subitem-icon" />} 
                      {item.title}
                  </li>
              ))}
          </ul>
      )}

      {module.link && module.cta && (
        <Link to={module.link} className="box-cta">
          {module.cta}
        </Link>
      )}
    </div>
  );

  return (
    <div className="home-bento-container">
      {/* Optional Speaker component for top banner */}
       <Speaker /> 

      {/* Main Grid for Bento Boxes */}
      <div className="bento-grid">
        {BENTO_MODULES.map(module => (
          <BentoBox key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

export default Home;