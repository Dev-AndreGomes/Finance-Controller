'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 shadow-[var(--shadow-card)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  'w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const primaryButtonClass = `${buttonBase} bg-accent text-accent-contrast hover:brightness-110`;

export const secondaryButtonClass = `${buttonBase} border border-line text-ink hover:bg-surface-alt`;

export const dangerTextButtonClass = 'text-muted hover:text-red transition-colors';
