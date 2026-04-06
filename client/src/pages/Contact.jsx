import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, wire this to an API endpoint or email service
    setSent(true);
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h2 className="section-title">Contact Us</h2>
        {sent ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: 12 }}>Message Sent!</h3>
            <p style={{ color: 'var(--text-muted)' }}>We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Message</button>
            </form>
          </div>
        )}
        <div className="grid grid-3" style={{ marginTop: 40 }}>
          {[
            { label: 'Location', value: '123 Dance Ave, Los Angeles, CA 90001' },
            { label: 'Email', value: 'info@dancestudio.com' },
            { label: 'Phone', value: '(213) 555-0199' },
          ].map((info) => (
            <div className="card" key={info.label} style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>{info.label}</h4>
              <p style={{ color: 'var(--text-muted)' }}>{info.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
