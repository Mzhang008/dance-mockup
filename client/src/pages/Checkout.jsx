import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../utils/auth';
import api from '../utils/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

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
      <h3 style={{ marginBottom: 16 }}>Create Account</h3>
      {error && <p style={{ color: '#f44336', marginBottom: 12 }}>{error}</p>}
      {['name', 'email', 'password', 'phone'].map((field) => (
        <div className="form-group" key={field}>
          <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
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
      <h3 style={{ marginBottom: 16 }}>Login</h3>
      {error && <p style={{ color: '#f44336', marginBottom: 12 }}>{error}</p>}
      {['email', 'password'].map((field) => (
        <div className="form-group" key={field}>
          <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
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

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data)).catch(() => {});
  }, []);

  const handleBook = async (classId) => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/create-checkout-session', { classId });
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!classes.length) {
    return (
      <div>
        <h3 style={{ marginBottom: 16 }}>Available Classes</h3>
        <p style={{ color: 'var(--text-muted)' }}>No classes available right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Available Classes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {classes.map((c) => (
          <div className="card" key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>{c.title}</h4>
              <span className="tag">{c.style}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>{c.teacher?.name}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '1.25rem' }}>${c.price}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.enrolled}/{c.capacity} spots</div>
              <button className="btn btn-primary" style={{ marginTop: 8, padding: '8px 20px' }} onClick={() => handleBook(c._id)} disabled={loading}>
                {loading ? 'Processing...' : 'Book Now'}
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

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Book a Class</h2>
        <div className="grid grid-2">
          <div>
            {user ? (
              <Elements stripe={stripePromise}>
                <ClassList />
              </Elements>
            ) : (
              <div className="card">
                {isLogin ? <LoginForm /> : <SignupForm />}
                <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)' }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isLogin ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>How It Works</h3>
            <ol style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>
              <li style={{ marginBottom: 12 }}>Create an account or log in</li>
              <li style={{ marginBottom: 12 }}>Browse available classes</li>
              <li style={{ marginBottom: 12 }}>Click "Book Now" to pay via Stripe</li>
              <li>Show up and dance!</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
