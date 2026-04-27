import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">Yinhe</div>
            <p className="footer-desc">
              Bridging cultures through movement. Kpop and Chinese dance classes for all levels in Los Angeles.
            </p>
          </div>
          <div className="footer-col">
            <h4>Navigate</h4>
            <Link to="/schedule">Schedule</Link>
            <Link to="/teachers">Instructors</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/packages">Packages</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Studio</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.8 }}>
              123 Dance Ave<br />
              Los Angeles, CA 90001<br />
              info@yinhedance.com
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Yinhe Dance Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
