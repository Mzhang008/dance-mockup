import { useEffect, useState } from 'react';
import api from '../utils/api';

const FALLBACK_EVENTS = [
  { id: '1', title: 'Kpop Beginner', start: '2025-01-06T18:00:00', end: '2025-01-06T19:00:00', description: 'Learn the basics of Kpop dance' },
  { id: '2', title: 'Chinese Classical', start: '2025-01-07T19:00:00', end: '2025-01-07T20:30:00', description: 'Traditional Chinese dance foundations' },
  { id: '3', title: 'Kpop Advanced', start: '2025-01-08T20:00:00', end: '2025-01-08T21:30:00', description: 'Full choreography breakdown' },
];

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/calendar/events')
      .then(({ data }) => {
        if (cancelled) return;
        setEvents(data.length ? data : FALLBACK_EVENTS);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Could not load schedule');
        setEvents(FALLBACK_EVENTS);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="section-label">Plan Your Visit</p>
          <h1>Class Schedule</h1>
          <p>Synced with Google Calendar — always up to date.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>}
          {error && <p style={{ textAlign: 'center', color: '#ef5350' }}>{error}</p>}
          {!loading && (
            <div>
              {events.map((evt) => (
                <div className="schedule-event" key={evt.id}>
                  <div className="schedule-event-time">
                    <div>{formatTime(evt.start)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.05em' }}>
                      to {new Date(evt.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <h3>{evt.title}</h3>
                    <p style={{ fontSize: '0.875rem' }}>{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
