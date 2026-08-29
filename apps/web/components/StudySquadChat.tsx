'use client';

import React, { useState } from 'react';

export function StudySquadChat() {
  const [messages, setMessages] = useState([
    { id: '1', author: 'Ava', content: 'Need help on quadratic equations?', type: 'question' },
    { id: '2', author: 'Sam', content: 'I can explain the discriminant step-by-step.', type: 'answer' },
  ]);
  const [draft, setDraft] = useState('');

  const sendMessage = () => {
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      { id: String(Date.now()), author: 'Me', content: draft, type: 'question' },
    ]);
    setDraft('');
  };

  return (
    <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 16, padding: 16, maxWidth: 440 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong>Study Squad Live Chat</strong>
        <button style={{ background: '#22c55e', color: '#052e16', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
          Ask Squad for Help
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 12, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
        {messages.map((message) => (
          <div key={message.id} style={{ background: 'rgba(148,163,184,0.14)', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>{message.author}</div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder={'Ask your squad...'}
          style={{ flex: 1, borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: '#111827', color: '#f8fafc', padding: 10 }}
        />
        <button onClick={sendMessage} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default StudySquadChat;
