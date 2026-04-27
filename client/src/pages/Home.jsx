import { Link } from 'react-router-dom';

const STYLES = [
  {
    title: 'Kpop',
    desc: 'Learn choreography from the latest hits.',
    bg: 'linear-gradient(135deg, #1a0a2e 0%, #0a0a2e 100%)',
  },
  {
    title: 'Chinese Dance',
    desc: 'Classical and contemporary, rooted in tradition.',
    bg: 'linear-gradient(135deg, #1a0f00 0%, #0a0a0a 100%)',
  },
  {
    title: 'Contemporary',
    desc: 'Lyrical movement with a modern twist.',
    bg: 'linear-gradient(135deg, #0a1a1a 0%, #0a0a0a 100%)',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <p className="hero-label">Los Angeles Dance Studio</p>
          <h1>
            Feel the <em>Rhythm</em>
          </h1>
          <p className="hero-desc">
            Premium Kpop and Chinese dance classes taught by industry professionals. All levels welcome.
          </p>
          <div className="hero-actions">
            <Link to="/schedule" className="btn btn-primary">View Schedule</Link>
            <Link to="/checkout" className="btn btn-outline">Book a Class</Link>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* About preview */}
      <section className="section">
        <div className="container">
          <div className="about-split">
            <div className="about-image">
              <img
                src="https://placehold.co/600x750/1a1a1a/c9a96e?text=Dance"
                alt="Dancers in studio"
              />
            </div>
            <div className="about-text">
              <p className="section-label">About Us</p>
              <h2>Where Movement Meets Culture</h2>
              <p>
                Yinhe Dance Studio is a creative space bridging East Asian dance culture with contemporary expression. Founded by passionate dancers, we bring Kpop choreography and traditional Chinese dance to Los Angeles.
              </p>
              <p>
                Our classes are open to all levels — whether you're a complete beginner or a seasoned performer, there's a place for you here.
              </p>
              <Link to="/teachers" className="btn" style={{ marginTop: 16 }}>Meet Our Team</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-dark">
        <div className="container">
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Classes Monthly</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">12</div>
              <div className="stat-label">Instructors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5</div>
              <div className="stat-label">Years</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dance Styles */}
      <section className="section">
        <div className="container">
          <p className="section-label">What We Teach</p>
          <h2 className="section-title">Our Styles</h2>
          <div className="section-divider" />
          <p className="section-subtitle">From Kpop to classical Chinese dance — find your movement.</p>
          <div className="grid grid-3">
            {STYLES.map((s) => (
              <div className="style-card" key={s.title}>
                <div className="style-card-bg" style={{ background: s.bg }} />
                <div className="style-card-overlay" />
                <div className="style-card-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="section section-dark">
        <div className="container">
          <p className="section-label">Follow Along</p>
          <h2 className="section-title">Instagram</h2>
          <div className="section-divider" />
          <div className="ig-feed">
            <div style={{
              border: '1px solid var(--border)',
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                Instagram feed will appear here.
              </p>
              <code style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                {'<script async src="//www.instagram.com/embed.js"></script>'}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <p className="section-label">Ready to Dance?</p>
          <h2 className="section-title">Join Our Next Class</h2>
          <div className="section-divider" />
          <p className="section-subtitle" style={{ maxWidth: 480, margin: '0 auto 48px' }}>
            First class is on us. Experience what makes Yinhe special.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/schedule" className="btn btn-primary">View Schedule</Link>
            <Link to="/contact" className="btn btn-outline">Get in Touch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
