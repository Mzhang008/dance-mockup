import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../utils/auth';
import api from '../utils/api';

function PurchaseForm({ pkg, onSuccess, onCancel }) {
  const cardRef = useRef(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.Square) return setError('Square SDK failed to load');
      try {
        const payments = window.Square.payments(
          process.env.REACT_APP_SQUARE_APP_ID,
          process.env.REACT_APP_SQUARE_LOCATION_ID
        );
        const card = await payments.card();
        await card.attach('#package-card-container');
        if (cancelled) {
          card.destroy();
          return;
        }
        cardRef.current = card;
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
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
      const tok = await cardRef.current.tokenize();
      if (tok.status !== 'OK') throw new Error(tok.errors?.[0]?.message || 'Tokenization failed');
      const { data } = await api.post(`/packages/${pkg._id}/purchase`, {
        sourceId: tok.token,
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
      <h3>Purchase — {pkg.name}</h3>
      <p style={{ marginBottom: 32, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
        ${pkg.price.toFixed(2)} USD
      </p>
      <div id="package-card-container"></div>
      {error && <p className="payment-error">{error}</p>}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={processing}>Cancel</button>
        <button className="btn btn-primary" onClick={handlePay} disabled={processing || !ready} style={{ flex: 1 }}>
          {processing ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}

function PackageCard({ pkg, onBuy }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
      <div className="tag" style={{ alignSelf: 'center', marginBottom: 24 }}>
        {pkg.type === 'punchcard' ? 'Punchcard' : 'Membership'}
      </div>
      <h3 style={{ marginBottom: 16, fontWeight: 300 }}>{pkg.name}</h3>
      <p style={{ marginBottom: 32, fontSize: '0.875rem' }}>{pkg.description}</p>
      <div style={{
        fontSize: '3rem',
        fontFamily: 'var(--serif)',
        fontWeight: 300,
        color: 'var(--accent)',
        marginBottom: 8,
      }}>
        ${pkg.price}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 40 }}>
        {pkg.type === 'punchcard'
          ? `${pkg.credits} class credits`
          : `Unlimited for ${pkg.durationDays} days`}
      </div>
      <button className="btn btn-primary" onClick={() => onBuy(pkg)} style={{ marginTop: 'auto' }}>
        Purchase
      </button>
    </div>
  );
}

function MyPackages() {
  const [owned, setOwned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/packages/me')
      .then(({ data }) => setOwned(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading your packages...</p>;
  if (!owned.length) return null;

  return (
    <div style={{ marginBottom: 80 }}>
      <p className="section-label">Your Collection</p>
      <h2 className="section-title" style={{ fontSize: '2.25rem', marginBottom: 48 }}>Active Packages</h2>
      <div className="grid grid-3">
        {owned.map((up) => (
          <div className="card" key={up._id} style={{ textAlign: 'center' }}>
            <h4 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.25rem', marginBottom: 16 }}>
              {up.package?.name || 'Package'}
            </h4>
            <span className="tag">{up.status}</span>
            <div style={{ marginTop: 20, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {up.type === 'punchcard'
                ? `${up.creditsRemaining} credits remaining`
                : `Expires ${new Date(up.expiresAt).toLocaleDateString()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FALLBACK_PACKAGES = [
  { _id: 'single-class', name: 'Single Class', description: 'One drop-in class. Any style, any session.', type: 'punchcard', price: 15, credits: 1, active: true },
  { _id: '5-class-pack', name: '5-Class Pack', description: 'Five class credits. Use anytime, any style. Never expires.', type: 'punchcard', price: 45, credits: 5, active: true },
];

export default function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/packages')
      .then(({ data }) => { if (!cancelled) setPackages(data.length ? data : FALLBACK_PACKAGES); })
      .catch(() => { if (!cancelled) setPackages(FALLBACK_PACKAGES); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (success) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <p className="section-label">Confirmed</p>
            <h1>Package Purchased</h1>
          </div>
        </div>
        <section className="section" style={{ textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <p style={{ marginBottom: 48, fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
              Your package is now active. Use it on the Checkout page.
            </p>
            <button className="btn btn-outline" onClick={() => { setSuccess(false); setSelected(null); }}>
              Browse More
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
          <p className="section-label">Save More</p>
          <h1>Packages & Memberships</h1>
          <p>Class packs and unlimited memberships for committed dancers.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {user && <MyPackages />}

          {selected ? (
            user ? (
              <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
                <PurchaseForm
                  pkg={selected}
                  onSuccess={() => setSuccess(true)}
                  onCancel={() => setSelected(null)}
                />
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Please <a href="/checkout">log in</a> to purchase a package.
              </p>
            )
          ) : (
            <>
              {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading packages...</p>}
              {error && <p style={{ textAlign: 'center', color: '#ef5350' }}>{error}</p>}
              {!loading && !packages.length && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No packages available right now.</p>
              )}
              <div className="grid grid-3">
                {packages.map((p) => (
                  <PackageCard key={p._id} pkg={p} onBuy={setSelected} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
