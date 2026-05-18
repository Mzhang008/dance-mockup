import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/auth';
import api from '../utils/api';

function SignupForm() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(form.name, form.email, form.password, form.phone);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 32 }}>Create Account</h3>
      {error && <p className="payment-error">{error}</p>}
      {['name', 'email', 'password', 'phone'].map((field) => (
        <div className="form-group" key={field}>
          <label>{field}</label>
          <input
            type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
            placeholder={field === 'phone' ? '(optional)' : ''}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required={field !== 'phone'}
          />
        </div>
      ))}
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign Up</button>
    </form>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 32 }}>Welcome Back</h3>
      {error && <p className="payment-error">{error}</p>}
      {['email', 'password'].map((field) => (
        <div className="form-group" key={field}>
          <label>{field}</label>
          <input
            type={field === 'password' ? 'password' : 'email'}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required
          />
        </div>
      ))}
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
    </form>
  );
}

function SquarePaymentForm({ selectedClass, onSuccess, onCancel }) {
  const cardRef = useRef(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initSquare() {
      if (!window.Square) {
        setError('Square SDK failed to load');
        return;
      }
      try {
        const payments = window.Square.payments(
          process.env.REACT_APP_SQUARE_APP_ID,
          process.env.REACT_APP_SQUARE_LOCATION_ID
        );
        const cardInstance = await payments.card();
        await cardInstance.attach('#square-card-container');
        if (cancelled) {
          cardInstance.destroy();
          return;
        }
        cardRef.current = cardInstance;
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    initSquare();
    return () => {
      cancelled = true;
      if (cardRef.current) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
    };
  }, []);

  const handlePay = async () => {
    if (!cardRef.current || processing) return;
    setProcessing(true);
    setError('');
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
      }
      const { data } = await api.post('/payments/process-payment', {
        sourceId: result.token,
        classId: selectedClass._id,
        idempotencyKey: idempotencyKeyRef.current,
      });
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-wrap">
      <h3>Payment — {selectedClass.title}</h3>
      <p style={{ marginBottom: 32, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
        ${selectedClass.price.toFixed(2)} USD
      </p>
      <div id="square-card-container"></div>
      {error && <p className="payment-error">{error}</p>}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={processing}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handlePay} disabled={processing || !ready} style={{ flex: 1 }}>
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

const FALLBACK_CLASSES = [
  { _id: 'drop-in', title: 'Drop-In Class', style: 'kpop', price: 15, capacity: 30, enrolled: 0, description: 'Single drop-in class. Any style, any session.', teacher: null },
];

function ClassList({ onSelect, onRedeemSuccess }) {
  const [classes, setClasses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [redeemingId, setRedeemingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/classes')
      .then(({ data }) => setClasses(data.length ? data : FALLBACK_CLASSES))
      .catch(() => setClasses(FALLBACK_CLASSES));
    api.get('/packages/me').then(({ data }) => setPackages(data)).catch(() => {});
  }, []);

  const usablePackages = packages.filter(
    (p) =>
      p.status === 'active' &&
      ((p.type === 'punchcard' && p.creditsRemaining > 0) ||
        (p.type === 'membership' && new Date(p.expiresAt) > new Date()))
  );

  const handleRedeem = async (cls) => {
    setRedeemingId(cls._id);
    setError('');
    try {
      await api.post('/payments/redeem-package', { classId: cls._id });
      onRedeemSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Redemption failed');
    } finally {
      setRedeemingId(null);
    }
  };

  if (!classes.length) {
    return (
      <div>
        <h3 style={{ marginBottom: 24 }}>Available Classes</h3>
        <p>No classes available right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Available Classes</h3>
      {usablePackages.length > 0 && (
        <p style={{ marginBottom: 24, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          You have {usablePackages.length} active package{usablePackages.length > 1 ? 's' : ''} — redeem instead of paying.
        </p>
      )}
      {error && <p className="payment-error">{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {classes.map((c) => (
          <div key={c._id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '28px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: 8 }}>{c.title}</h4>
              <span className="tag">{c.style}</span>
              <span style={{ marginLeft: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {c.teacher?.name}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.375rem', fontFamily: 'var(--serif)', fontWeight: 300, color: 'var(--accent)', marginBottom: 12 }}>
                ${c.price}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.625rem' }} onClick={() => onSelect(c)}>
                  Pay
                </button>
                {usablePackages.length > 0 && (
                  <button
                    className="btn btn-outline"
                    style={{ padding: '10px 24px', fontSize: '0.625rem' }}
                    onClick={() => handleRedeem(c)}
                    disabled={redeemingId === c._id}
                  >
                    {redeemingId === c._id ? '...' : 'Redeem'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [success, setSuccess] = useState(null);

  if (success) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <p className="section-label">Confirmed</p>
            <h1>Booking Complete</h1>
          </div>
        </div>
        <section className="section" style={{ textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <p style={{ marginBottom: 48, fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
              Your booking is confirmed. See you in class.
            </p>
            <button className="btn btn-outline" onClick={() => { setSuccess(null); setSelectedClass(null); }}>
              Book Another Class
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="section-label">Enroll</p>
          <h1>Book a Class</h1>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ gap: 64 }}>
            <div>
              {!user ? (
                <div className="card">
                  {isLogin ? <LoginForm /> : <SignupForm />}
                  <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                  </p>
                </div>
              ) : selectedClass ? (
                <div className="card">
                  <SquarePaymentForm
                    selectedClass={selectedClass}
                    onSuccess={setSuccess}
                    onCancel={() => setSelectedClass(null)}
                  />
                </div>
              ) : (
                <div className="card">
                  <ClassList
                    onSelect={setSelectedClass}
                    onRedeemSuccess={() => setSuccess({ redeemed: true })}
                  />
                </div>
              )}
            </div>
            <div className="card" style={{ alignSelf: 'flex-start' }}>
              <p className="section-label" style={{ textAlign: 'left', marginBottom: 20 }}>Process</p>
              <h3 style={{ marginBottom: 32, fontWeight: 300 }}>How It Works</h3>
              <ol style={{ paddingLeft: 20, lineHeight: 2.4, color: 'var(--text-secondary)' }}>
                <li>Create an account or log in</li>
                <li>Browse available classes</li>
                <li>Enter card details via Square</li>
                <li>Show up and dance</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
