'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// aviso/erro fica mais tempo na tela, dá mais tempo de ler
const DURATIONS: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  warning: 6000,
  error: 6000,
};

const STYLES: Record<ToastType, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-green/30 text-green' },
  info: { icon: Info, className: 'border-accent/30 text-accent' },
  warning: { icon: AlertTriangle, className: 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400' },
  error: { icon: XCircle, className: 'border-red/30 text-red' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    // id simples só pra distinguir na lista, não precisa ser uuid de verdade aqui
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATIONS[type]);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, className } = STYLES[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`bg-surface border rounded-xl shadow-[var(--shadow-card)] px-4 py-3 flex items-start gap-3 ${className}`}
              >
                <Icon size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm text-ink flex-1">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink transition-colors shrink-0">
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de um ToastProvider');
  return ctx.showToast;
}
