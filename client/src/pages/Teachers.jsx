import { useEffect, useState } from 'react';
import api from '../utils/api';

const FALLBACK_TEACHERS = [
  { _id: '1', name: 'Mina Park', photo: '', specialties: ['kpop', 'hip hop'], bio: 'Former backup dancer for SM Entertainment artists. 10+ years of experience teaching Kpop choreography.' },
  { _id: '2', name: 'Wei Chen', photo: '', specialties: ['chinese', 'contemporary'], bio: 'Classically trained in Beijing Dance Academy. Blends traditional Chinese dance with modern expression.' },
  { _id: '3', name: 'Jisoo Kim', photo: '', specialties: ['kpop', 'contemporary'], bio: 'Choreographer and dancer specializing in Kpop girl-group style and lyrical movement.' },
];

export default function Teachers() {
  const [teachers, setTeachers] = useState(FALLBACK_TEACHERS);

  useEffect(() => {
    api.get('/classes/teachers/all')
      .then(({ data }) => { if (data.length) setTeachers(data); })
      .catch(() => {});
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Our Instructors</h2>
        <div className="grid grid-3">
          {teachers.map((t) => (
            <div className="card teacher-card" key={t._id}>
              <img
                src={t.photo || `https://placehold.co/160x160/1a1a2e/e91e63?text=${t.name.charAt(0)}`}
                alt={t.name}
              />
              <h3>{t.name}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{t.bio}</p>
              <div className="teacher-specialties">
                {t.specialties.map((s) => <span className="tag" key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
