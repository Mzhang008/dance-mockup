import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="section-label">Get in Touch</p>
          <h1>Contact</h1>
          <p>We'd love to hear from you.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {sent ? (
            <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              <p className="section-label">Thank You</p>
              <h2 className="section-title" style={{ marginBottom: 24 }}>Message Sent</h2>
              <p>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <div className="contact-grid">
              <div>
                <p className="section-label" style={{ textAlign: 'left' }}>Send a Message</p>
                <h2 style={{ fontSize: '2.25rem', marginBottom: 40, fontWeight: 300 }}>
                  Let's Connect
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      placeholder="How can we help?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Send Message
                  </button>
                </form>
              </div>
              <div style={{ paddingTop: 80 }}>
                <div className="contact-info-item">
                  <h4>Studio</h4>
                  <p>123 Dance Ave<br />Los Angeles, CA 90001</p>
                </div>
                <div className="contact-info-item">
                  <h4>Email</h4>
                  <p>info@yinhedance.com</p>
                </div>
                <div className="contact-info-item">
                  <h4>Phone</h4>
                  <p>(213) 555-0199</p>
                </div>
                <div className="contact-info-item">
                  <h4>Hours</h4>
                  <p>Mon – Fri: 4pm – 10pm<br />Sat – Sun: 10am – 8pm</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
