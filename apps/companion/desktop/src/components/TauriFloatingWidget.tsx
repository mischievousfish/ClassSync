import { useEffect, useMemo, useState } from 'react';

export interface StudentProfile {
  id: string;
  name: string;
  notes: string;
  risk: 'low' | 'medium' | 'high';
}

const demoStudents: StudentProfile[] = [
  { id: 's1', name: 'Ava Patel', notes: 'Strong in algebra; needs support with fractions.', risk: 'low' },
  { id: 's2', name: 'Marcus Lee', notes: 'Excellent participation; missed last checkpoint.', risk: 'medium' },
  { id: 's3', name: 'Jin Park', notes: 'Needs alternate explanation for geometry proofs.', risk: 'high' },
];

export function TauriFloatingWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [studentQuery, setStudentQuery] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [randomStudent, setRandomStudent] = useState<StudentProfile | null>(demoStudents[0]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 30));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const results = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return demoStudents;
    return demoStudents.filter((student) => student.name.toLowerCase().includes(query) || student.notes.toLowerCase().includes(query));
  }, [studentQuery]);

  const pickRandomStudent = () => {
    const next = demoStudents[Math.floor(Math.random() * demoStudents.length)];
    setRandomStudent(next);
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        top: 20,
        width: 330,
        background: 'rgba(15,23,42,0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        border: '1px solid rgba(148,163,184,0.25)',
        color: '#e2e8f0',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.45)',
        zIndex: 99999,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
        <strong>ClassSync Companion</strong>
        <button style={{ background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer' }} onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {isOpen && (
        <div style={{ padding: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(59,130,246,0.18)', borderRadius: 10 }}>
            <span>AI Quiz</span>
            <button style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              30s Generate
            </button>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#cbd5e1' }}>Student quick search</label>
            <input
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Search student name"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.7)', color: '#fff' }}
            />
            <div style={{ display: 'grid', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {results.map((student) => (
                <div key={student.id} style={{ background: 'rgba(15,23,42,0.75)', borderRadius: 8, padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{student.name}</strong>
                    <span style={{ fontSize: 11, color: student.risk === 'high' ? '#fca5a5' : student.risk === 'medium' ? '#fbbf24' : '#86efac' }}>
                      {student.risk}
                    </span>
                  </div>
                  <small style={{ color: '#cbd5e1' }}>{student.notes}</small>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30,41,59,0.9)', borderRadius: 10, padding: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>Class timer</div>
              <strong>{secondsLeft}s</strong>
            </div>
            <button style={{ background: '#10b981', color: '#062b1d', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }} onClick={pickRandomStudent}>
              Random pick
            </button>
          </div>

          {randomStudent && (
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>Selected student</div>
              <strong>{randomStudent.name}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TauriFloatingWidget;
