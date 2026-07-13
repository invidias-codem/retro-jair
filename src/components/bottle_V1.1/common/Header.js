import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

/**
 * Header (Phase 1 hybrid restyle)
 * - Wordmark: "JJ · Mohammed"
 * - Trimmed nav: Home, About, Projects, Skills, Contact
 * - "Try the Agent" CTA → /chat (hero feature, not hidden)
 * - Mobile: hamburger → same trimmed menu
 *
 * Props: onToggleTheme, onOpenMenu, isMobile
 */
const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
  { to: '/contact', label: 'Contact' },
];

export default function Header({ onOpenMenu, isMobile }) {
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

  const go = (to) => { setOpen(false); navigate(to); };

  return (
    <header className="app-header jj-header" role="banner">
      <div className="header-left">
        <button className="brand-btn jj-brand" onClick={() => navigate('/')} aria-label="Go to Home">
          <span className="jj-brand-mark">JJ</span>
          <span className="jj-brand-name">Mohammed</span>
        </button>
      </div>

      {!isMobile && (
        <nav className="header-nav jj-nav" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `nav-link jj-nav-link${isActive ? ' active' : ''}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}

      <nav className="header-actions jj-actions" aria-label="Actions">
        {isMobile ? (
          <div className="mobile-actions">
            <button
              ref={btnRef}
              className="hamburger-btn jj-hamburger"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open Menu"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls="mobileMenu"
            >
              ☰
            </button>
            {open && (
              <div id="mobileMenu" className="mobile-menu jj-mobile-menu" role="menu" ref={menuRef}>
                <h2 id="mobileMenuTitle" className="sr-only">Navigation</h2>
                <div className="menu-group" aria-label="Primary">
                  {NAV.map((n) => (
                    <button key={n.to} className="menu-btn jj-menu-btn" role="menuitem" onClick={() => go(n.to)}>
                      {n.label}
                    </button>
                  ))}
                </div>
                <hr className="menu-sep jj-menu-sep" />
                <div className="menu-group" aria-label="Actions">
                  <button className="menu-btn jj-menu-btn jj-menu-cta" role="menuitem" onClick={() => go('/chat')}>
                    Try the Agent
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="action-btn jj-action jj-action-ghost" onClick={() => navigate('/chat')} aria-label="Try the Agent">
              Try the Agent
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
