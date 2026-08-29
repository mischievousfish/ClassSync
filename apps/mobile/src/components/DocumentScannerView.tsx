import React, { useMemo, useState } from 'react';

export interface ScannerOverlay {
  mode: 'original' | 'magic-color' | 'bw-document';
}

export function DocumentScannerView({ mode }: ScannerOverlay) {
  const [showManualAdjust, setShowManualAdjust] = useState(false);
  const [stability] = useState(94);

  const overlayStyle = useMemo<React.CSSProperties>(() => ({
    position: 'relative',
    width: '100%',
    height: 420,
    background: mode === 'bw-document' ? '#111827' : mode === 'magic-color' ? '#164e63' : '#1f2937',
    borderRadius: 24,
    overflow: 'hidden',
    border: '2px solid #22c55e',
  }), [mode]);

  return (
    <div style={{ display: 'grid', gap: 14, fontFamily: 'sans-serif' }}>
      <div style={overlayStyle}>
        <div style={{ position: 'absolute', inset: 20, border: '3px solid rgba(34,197,94,0.9)', borderRadius: 10 }} />
        <div style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(15,23,42,0.6)', color: '#d1fae5', padding: '6px 10px', borderRadius: 999 }}>
          Stability {stability}%
        </div>
        <div style={{ position: 'absolute', left: 32, top: 32, width: 20, height: 20, borderLeft: '4px solid #22c55e', borderTop: '4px solid #22c55e', borderRadius: 8 }} />
        <div style={{ position: 'absolute', right: 32, top: 32, width: 20, height: 20, borderRight: '4px solid #22c55e', borderTop: '4px solid #22c55e', borderRadius: 8 }} />
        <div style={{ position: 'absolute', left: 32, bottom: 32, width: 20, height: 20, borderLeft: '4px solid #22c55e', borderBottom: '4px solid #22c55e', borderRadius: 8 }} />
        <div style={{ position: 'absolute', right: 32, bottom: 32, width: 20, height: 20, borderRight: '4px solid #22c55e', borderBottom: '4px solid #22c55e', borderRadius: 8 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Original', 'Magic Color', 'B&W Document'].map((label) => (
          <button key={label} style={{ background: mode === label.toLowerCase().replace(/ /g, '-') ? '#22c55e' : '#e2e8f0', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>
            {label}
          </button>
        ))}
        <button onClick={() => setShowManualAdjust((value) => !value)} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>
          Adjust corners
        </button>
      </div>

      {showManualAdjust && (
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Manual corner tuning</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['Top left', 'Top right', 'Bottom right', 'Bottom left'].map((corner) => (
              <button key={corner} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
                {corner}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentScannerView;
