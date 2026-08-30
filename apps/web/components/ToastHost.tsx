'use client';

import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastMessage = {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: ToastMessage['type']; title: string; message: string }>;
      const { type, title, message } = customEvent.detail ?? {};

      if (!type || !title || !message) return;

      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type, title, message }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3200);
    };

    window.addEventListener('classsync:toast', handleToast);
    return () => window.removeEventListener('classsync:toast', handleToast);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#10272a]/10 bg-white/95 p-3 shadow-xl backdrop-blur-sm"
        >
          <div className={`mt-0.5 rounded-full p-1 ${toast.type === 'error' ? 'bg-[#ff8068]/15 text-[#b94a3d]' : toast.type === 'success' ? 'bg-[#d8f36d]/30 text-[#10272a]' : 'bg-[#b9e5df]/40 text-[#10272a]'}`}>
            {toast.type === 'error' ? <TriangleAlert size={14} /> : toast.type === 'success' ? <CheckCircle2 size={14} /> : <Info size={14} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#10272a]">{toast.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#10272a]/70">{toast.message}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            className="mt-0.5 text-[#10272a]/50 transition hover:text-[#10272a]"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
