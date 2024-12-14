import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCode, faCogs, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import './Menu.css'; 

function Menu() {
  return (
    <div id="menuContainer">
      <h2 id="menuTitle">Menu</h2>
      <div id="menuItemGrid">
        <Link to="/about" id="menuItemAbout">
          <div id="menuItemIconWrapperAbout">
            <FontAwesomeIcon icon={faUser} id="menuItemIconAbout" />
          </div>
          <span>About Me</span>
        </Link>
        <Link to="/projects" id="menuItemProjects">
          <div id="menuItemIconWrapperProjects">
            <FontAwesomeIcon icon={faCode} id="menuItemIconProjects" />
          </div>
          <span>Projects</span>
        </Link>
        <Link to="/skills" id="menuItemSkills">
          <div id="menuItemIconWrapperSkills">
            <FontAwesomeIcon icon={faCogs} id="menuItemIconSkills" />
          </div>
          <span>Skills</span>
        </Link>
        <Link to="/contact" id="menuItemContact">
          <div id="menuItemIconWrapperContact">
            <FontAwesomeIcon icon={faEnvelope} id="menuItemIconContact" />
          </div>
          <span>Contact</span>
        </Link>
      </div>
    </div>
  );
}

export default Menu;