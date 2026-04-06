import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">DANCE STUDIO</Link>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><Link to="/teachers">Teachers</Link></li>
          <li><Link to="/schedule">Schedule</Link></li>
          <li><Link to="/checkout">Classes</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          {user ? (
            <li><button className="btn btn-outline" onClick={logout} style={{ padding: '6px 16px' }}>Logout</button></li>
          ) : (
            <li><Link to="/checkout" className="btn btn-primary" style={{ padding: '6px 16px' }}>Sign Up</Link></li>
          )}
        </ul>
      </div>
    </nav>
  );
}
