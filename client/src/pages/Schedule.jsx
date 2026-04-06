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
  const [events, setEvents] = useState(FALLBACK_EVENTS);

  useEffect(() => {
    api.get('/calendar/events')
      .then(({ data }) => { if (data.length) setEvents(data); })
      .catch(() => {});
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Class Schedule</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40 }}>
          Synced with Google Calendar — always up to date
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {events.map((evt) => (
            <div className="card schedule-event" key={evt.id}>
              <div className="schedule-event-time">
                <div>{formatTime(evt.start)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  to {new Date(evt.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <h3>{evt.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{evt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
