import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">Yinhe</Link>
          <button
            className="nav-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--white)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {open ? '✕' : '☰'}
          </button>
          <ul className={`navbar-links${open ? ' open' : ''}`}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/teachers">Instructors</Link></li>
            <li><Link to="/schedule">Schedule</Link></li>
            <li><Link to="/packages">Packages</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            {user ? (
              <>
                <li><Link to="/checkout">Book Class</Link></li>
                <li>
                  <button
                    onClick={logout}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      padding: '8px 20px',
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.35s ease',
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li><Link to="/checkout" className="nav-cta">Book Now</Link></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
