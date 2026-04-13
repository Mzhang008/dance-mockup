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
      <p style={{ marginBottom: 32, fontSize: '0.9375rem' }}>${pkg.price.toFixed(2)} USD</p>
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
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tag" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        {pkg.type === 'punchcard' ? 'Punchcard' : 'Membership'}
      </div>
      <h3 style={{ marginBottom: 12 }}>{pkg.name}</h3>
      <p style={{ marginBottom: 24 }}>{pkg.description}</p>
      <div style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
        ${pkg.price}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 32 }}>
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

  if (loading) return <p>Loading your packages...</p>;
  if (!owned.length) return null;

  return (
    <div style={{ marginBottom: 80 }}>
      <h3 style={{ marginBottom: 32, textAlign: 'center' }}>Your Active Packages</h3>
      <div className="grid grid-3">
        {owned.map((up) => (
          <div className="card" key={up._id}>
            <h4 style={{ marginBottom: 12 }}>{up.package?.name || 'Package'}</h4>
            <span className="tag">{up.status}</span>
            <div style={{ marginTop: 16, fontSize: '0.875rem' }}>
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
      .then(({ data }) => { if (!cancelled) setPackages(data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (success) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h2 className="section-title">Package Purchased</h2>
          <p style={{ marginBottom: 40 }}>Your package is now active. Use it on the Checkout page.</p>
          <button className="btn btn-outline" onClick={() => { setSuccess(false); setSelected(null); }}>
            Browse More
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Packages & Memberships</h2>
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
            <p style={{ textAlign: 'center' }}>
              Please <a href="/checkout">log in</a> to purchase a package.
            </p>
          )
        ) : (
          <>
            {loading && <p style={{ textAlign: 'center' }}>Loading packages...</p>}
            {error && <p style={{ textAlign: 'center', color: '#b00020' }}>{error}</p>}
            {!loading && !packages.length && (
              <p style={{ textAlign: 'center' }}>No packages available right now.</p>
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
  );
}
