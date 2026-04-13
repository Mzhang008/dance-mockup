import { useEffect, useState } from 'react';
import api from '../utils/api';

const FALLBACK_TEACHERS = [
  { _id: '1', name: 'Mina Park', photo: '', specialties: ['kpop', 'hip hop'], bio: 'Former backup dancer for SM Entertainment artists. 10+ years of experience teaching Kpop choreography.' },
  { _id: '2', name: 'Wei Chen', photo: '', specialties: ['chinese', 'contemporary'], bio: 'Classically trained in Beijing Dance Academy. Blends traditional Chinese dance with modern expression.' },
  { _id: '3', name: 'Jisoo Kim', photo: '', specialties: ['kpop', 'contemporary'], bio: 'Choreographer and dancer specializing in Kpop girl-group style and lyrical movement.' },
];

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/classes/teachers/all')
      .then(({ data }) => {
        if (cancelled) return;
        setTeachers(data.length ? data : FALLBACK_TEACHERS);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Could not load teachers');
        setTeachers(FALLBACK_TEACHERS);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Our Instructors</h2>
        {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
        {error && <p style={{ textAlign: 'center', color: '#b00020' }}>{error}</p>}
        {!loading && (
          <div className="grid grid-3">
            {teachers.map((t) => (
              <div className="card teacher-card" key={t._id}>
                <img
                  src={t.photo || `https://placehold.co/180x180/f5f5f5/000000?text=${t.name.charAt(0)}`}
                  alt={t.name}
                />
                <h3>{t.name}</h3>
                <p style={{ marginBottom: 12 }}>{t.bio}</p>
                <div className="teacher-specialties">
                  {t.specialties.map((s) => <span className="tag" key={s}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
