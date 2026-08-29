type StudentProfile = {
  id: string;
  name: string;
  notes: string;
  class: string;
};

const defaultStudents: StudentProfile[] = [
  { id: '1', name: 'Ava Patel', notes: 'Strong in algebra, needs support with word problems.', class: 'Algebra II' },
  { id: '2', name: 'Marcus Lee', notes: 'Excellent participation, often early with lab submissions.', class: 'Biology' },
  { id: '3', name: 'Sofia Nguyen', notes: 'Needs more scaffolding on nonfiction summary tasks.', class: 'ELA' }
];

function TauriFloatingWidget() {
  const React = (globalThis as any).React;
  const { useEffect, useMemo, useState } = React;

  const [isExpanded, setIsExpanded] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile>(defaultStudents[0]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const timer = setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 0) {
          setIsTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const matches = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) {
      return defaultStudents;
    }
    return defaultStudents.filter((student) => `${student.name} ${student.notes}`.toLowerCase().includes(value));
  }, [search]);

  const randomStudent = () => {
    const next = defaultStudents[Math.floor(Math.random() * defaultStudents.length)];
    setSelectedStudent(next);
  };

  const beginQuickQuiz = async () => {
    const payload = {
      type: 'AI_QUIZ_GENERATOR',
      durationSeconds: 30,
      mode: 'quick-lesson-prep'
    };

    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      console.log('Dispatching quick quiz from Tauri', payload);
    }

    return payload;
  };

  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed',
        right: '20px',
        top: '20px',
        width: isExpanded ? '340px' : '200px',
        background: 'rgba(18, 20, 32, 0.9)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(14px)',
        borderRadius: '18px',
        color: '#f3f6ff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        zIndex: 2147483647,
        fontFamily: 'Segoe UI, sans-serif',
        userSelect: 'none'
      }
    },
    React.createElement(
      'div',
      {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }
      },
      React.createElement('div', { style: { fontWeight: 700, letterSpacing: '0.03em' } }, 'ClassSync'),
      React.createElement('button', {
        onClick: () => setIsExpanded((value) => !value),
        style: { background: 'transparent', border: 'none', color: '#c9d4ff', cursor: 'pointer' }
      }, isExpanded ? 'Hide' : 'Show')
    ),
    isExpanded && React.createElement(
      'div',
      { style: { padding: '14px' } },
      React.createElement(
        'div',
        { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' } },
        React.createElement(
          'button',
          {
            onClick: () => void beginQuickQuiz(),
            style: { background: 'linear-gradient(135deg, #5b8cff, #7a5cff)', border: 'none', borderRadius: '10px', color: 'white', padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }
          },
          '30s Quiz'
        ),
        React.createElement(
          'button',
          {
            onClick: randomStudent,
            style: { background: '#1f2637', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#ecf3ff', padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }
          },
          'Random Pick'
        )
      ),
      React.createElement(
        'div',
        { style: { marginBottom: '14px' } },
        React.createElement('div', { style: { fontSize: '12px', opacity: 0.7, marginBottom: '8px' } }, 'Class Timer'),
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' } },
          React.createElement('div', { style: { fontSize: '28px', fontWeight: 800 } }, `${timerSeconds}s`),
          React.createElement(
            'button',
            {
              onClick: () => setIsTimerRunning((value) => !value),
              style: { background: '#0e9f6e', border: 'none', borderRadius: '999px', color: 'white', padding: '8px 12px', cursor: 'pointer' }
            },
            isTimerRunning ? 'Pause' : 'Start'
          )
        )
      ),
      React.createElement(
        'div',
        { style: { marginBottom: '12px' } },
        React.createElement('div', { style: { fontSize: '12px', opacity: 0.7, marginBottom: '8px' } }, 'Student quick search'),
        React.createElement('input', {
          value: search,
          onChange: (event: any) => setSearch(event.target.value),
          placeholder: 'Search student notes',
          style: {
            width: '100%',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            padding: '8px 10px',
            color: 'white',
            boxSizing: 'border-box'
          }
        })
      ),
      React.createElement(
        'div',
        { style: { display: 'grid', gap: '8px', maxHeight: '170px', overflowY: 'auto' } },
        ...matches.map((student) => React.createElement(
          'button',
          {
            key: student.id,
            onClick: () => setSelectedStudent(student),
            style: {
              textAlign: 'left',
              border: selectedStudent?.id === student.id ? '1px solid rgba(91,140,255,0.9)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              padding: '10px',
              cursor: 'pointer'
            }
          },
          React.createElement('div', { style: { fontWeight: 700 } }, student.name),
          React.createElement('div', { style: { fontSize: '11px', opacity: 0.75 } }, student.class)
        ))
      ),
      selectedStudent && React.createElement(
        'div',
        { style: { marginTop: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' } },
        React.createElement('div', { style: { fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Teacher notes'),
        React.createElement('div', { style: { marginTop: '8px', lineHeight: 1.5, fontSize: '12px' } }, selectedStudent.notes)
      )
    )
  );
}

export default TauriFloatingWidget;
