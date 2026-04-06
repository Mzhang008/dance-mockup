import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Feel the <span>Rhythm</span></h1>
          <p>Premium Kpop &amp; Chinese dance classes taught by industry professionals. All levels welcome.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/schedule" className="btn btn-primary">View Schedule</Link>
            <Link to="/checkout" className="btn btn-outline">Book a Class</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Styles</h2>
          <div className="grid grid-3">
            {[
              { title: 'Kpop', desc: 'Learn choreography from the latest BTS, BLACKPINK, and NewJeans hits.' },
              { title: 'Chinese Dance', desc: 'Classical and contemporary Chinese dance rooted in tradition.' },
              { title: 'Hip Hop', desc: 'Street-style fundamentals with a modern, high-energy twist.' },
            ].map((s) => (
              <div className="card" key={s.title}>
                <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--dark)' }}>
        <div className="container">
          <h2 className="section-title">Follow Us on Instagram</h2>
          <div className="ig-feed">
            {/* Replace with your actual IG embed script/widget */}
            <blockquote
              className="instagram-media"
              data-instgrm-permalink="https://www.instagram.com/YOUR_STUDIO_HANDLE/"
              data-instgrm-version="14"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <p>Instagram feed will appear here. Add the Instagram embed script to public/index.html:</p>
              <code style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                {'<script async src="//www.instagram.com/embed.js"></script>'}
              </code>
            </blockquote>
          </div>
        </div>
      </section>
    </>
  );
}
