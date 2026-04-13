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
      <h3 style={{ marginBottom: 32 }}>Login</h3>
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
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
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
        if (mounted) setCard(cardInstance);
      } catch (err) {
        setError(err.message);
      }
    }
    initSquare();
    return () => {
      mounted = false;
      if (card) card.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async () => {
    if (!card) return;
    setProcessing(true);
    setError('');
    try {
      const result = await card.tokenize();
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
      }
      const { data } = await api.post('/payments/process-payment', {
        sourceId: result.token,
        classId: selectedClass._id,
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
      <p style={{ marginBottom: 32, fontSize: '0.9375rem' }}>
        ${selectedClass.price.toFixed(2)} USD
      </p>
      <div id="square-card-container" ref={cardRef}></div>
      {error && <p className="payment-error">{error}</p>}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={processing}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handlePay} disabled={processing || !card} style={{ flex: 1 }}>
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

function ClassList({ onSelect }) {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data)).catch(() => {});
  }, []);

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
      <h3 style={{ marginBottom: 32 }}>Available Classes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {classes.map((c) => (
          <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h4 style={{ fontSize: '1.125rem', marginBottom: 8 }}>{c.title}</h4>
              <span className="tag">{c.style}</span>
              <span style={{ marginLeft: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {c.teacher?.name}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: 8 }}>
                ${c.price}
              </div>
              <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => onSelect(c)}>
                Book
              </button>
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
      <section className="section">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h2 className="section-title">Payment Complete</h2>
          <p style={{ marginBottom: 40 }}>
            Your booking is confirmed. See you in class.
          </p>
          <button className="btn btn-outline" onClick={() => { setSuccess(null); setSelectedClass(null); }}>
            Book Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Book a Class</h2>
        <div className="grid grid-2">
          <div>
            {!user ? (
              <div className="card">
                {isLogin ? <LoginForm /> : <SignupForm />}
                <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem' }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ background: 'none', border: 'none', color: 'var(--black)', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}
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
                <ClassList onSelect={setSelectedClass} />
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 32 }}>How It Works</h3>
            <ol style={{ paddingLeft: 20, lineHeight: 2.2 }}>
              <li>Create an account or log in</li>
              <li>Browse available classes</li>
              <li>Enter card details via Square</li>
              <li>Show up and dance</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
