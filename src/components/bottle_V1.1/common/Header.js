import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

/**
 * Header (Desktop/Tablet)
 * - Left: Brand (navigates to home)
 * - Center: Primary navigation
 * - Right: Actions (Chat, Theme, Settings) or Hamburger on mobile (handled by parent prop isMobile)
 *
 * Props:
 * - onOpenChat: () => void
 * - onToggleTheme: () => void
 * - onOpenMenu: () => void (open mobile side panel)
 * - isMobile: boolean
 */
export default function Header({ onToggleTheme, onOpenMenu, isMobile }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const focusables = menuRef.current?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        if (!focusables || focusables.length === 0) return;
        const els = Array.from(focusables);
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onClickAway = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClickAway);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickAway);
    };
  }, [open]);

  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <button className="brand-btn" onClick={() => navigate('/')} aria-label="Go to Home">
          Retro Jair
        </button>
      </div>

      {!isMobile && (
        <nav className="header-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>About</NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Projects</NavLink>
          <NavLink to="/skills" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Skills</NavLink>
          <NavLink to="/services" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Services</NavLink>
          <NavLink to="/terminal" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Terminal</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Contact</NavLink>
        </nav>
      )}

      <nav className="header-actions" aria-label="Actions">
        {isMobile ? (
          <div className="mobile-actions">
            <button
              ref={btnRef}
              className="hamburger-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open Menu"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls="mobileMenu"
            >
              ☰
            </button>
            {open && (
              <div id="mobileMenu" className="mobile-menu" role="menu" ref={menuRef}>
                <h2 id="mobileMenuTitle" className="sr-only">Navigation</h2>
                <div className="menu-group" aria-label="Primary">
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/'); }}>Home</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/about'); }}>About</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/projects'); }}>Projects</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/skills'); }}>Skills</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/services'); }}>Services</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/terminal'); }}>Terminal</button>
                  <button className="menu-btn btn-primary" role="menuitem" onClick={() => { setOpen(false); navigate('/contact'); }}>Contact</button>
                </div>
                <hr className="menu-sep" />
                <div className="menu-group" aria-label="Actions">
                  <button className="menu-btn btn-cta pulse" role="menuitem" onClick={() => { setOpen(false); navigate('/chat'); }}>Chat</button>
                  <button className="menu-btn btn-secondary glow" role="menuitem" onClick={() => { onToggleTheme?.(); }}>Theme</button>
                  <button className="menu-btn btn-secondary slide" role="menuitem" onClick={() => { setOpen(false); navigate('/settings'); }}>Settings</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="action-btn" onClick={() => navigate('/chat')} aria-label="Open Chat">Chat</button>
            <button className="action-btn" onClick={onToggleTheme} aria-label="Toggle Theme">Theme</button>
            <button className="action-btn" onClick={() => navigate('/settings')} aria-label="Open Settings">Settings</button>
          </>
        )}
      </nav>
    </header>
  );
}
