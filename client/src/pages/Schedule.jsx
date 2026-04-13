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
    <section className="section">
      <div className="container">
        <h2 className="section-title">Class Schedule</h2>
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: 40 }}>
          Synced with Google Calendar — always up to date
        </p>
        {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
        {error && <p style={{ textAlign: 'center', color: '#b00020' }}>{error}</p>}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((evt) => (
              <div className="schedule-event" key={evt.id}>
                <div className="schedule-event-time">
                  <div>{formatTime(evt.start)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
                    to {new Date(evt.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <h3>{evt.title}</h3>
                  <p>{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
