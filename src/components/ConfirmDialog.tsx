'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal, secondaryButtonClass } from './ui';

export interface ConfirmOption {
  label: string;
  value: string;
  /** 'danger' pinta de vermelho (ações destrutivas), 'default' usa o estilo neutro. */
  variant?: 'danger' | 'default';
}

// Componente único pra qualquer confirmação do app: exclusão simples (1 opção
// "Excluir") ou exclusão com escolha (ex: "só este mês" vs "todos os meses").
// Fica tudo com a mesma cara em vez de cada tela ter seu próprio confirm().
export function ConfirmDialog({
  title,
  description,
  options,
  onSelect,
  onCancel,
}: {
  title: string;
  description?: string;
  options: ConfirmOption[];
  onSelect: (value: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        {description && (
          <div className="flex items-start gap-2.5 text-sm text-muted">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
            <p>{description}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                opt.variant === 'danger'
                  ? 'bg-red/10 text-red hover:bg-red/20'
                  : 'bg-surface-alt text-ink hover:bg-line'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button type="button" className={secondaryButtonClass} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
