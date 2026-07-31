'use client';

import { CheckCircle2, Clock } from 'lucide-react';

export function PaymentStatusBadge({
  isPaid,
  onTogglePaid,
}: {
  isPaid: boolean;
  /** se vier preenchido, o badge vira clicável (usado no cartão de crédito, pra marcar como pago) */
  onTogglePaid?: () => void;
}) {
  const content = isPaid ? (
    <>
      <CheckCircle2 size={11} /> Pago
    </>
  ) : (
    <>
      <Clock size={11} /> Pendente
    </>
  );

  const className = `text-[10px] uppercase tracking-wide rounded-full px-1.5 py-0.5 flex items-center gap-1 shrink-0 ${
    isPaid ? 'bg-green/10 text-green' : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
  }`;

  if (!onTogglePaid) {
    return <span className={className}>{content}</span>;
  }

  return (
    <button
      onClick={onTogglePaid}
      className={`${className} hover:brightness-95 transition-all`}
      title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
    >
      {content}
    </button>
  );
}
