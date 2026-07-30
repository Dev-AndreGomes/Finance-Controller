'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, PartyPopper, CalendarClock } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface Alert {
  icon: typeof AlertOctagon;
  message: string;
  className: string;
}

// limites usados pros alertas de saúde financeira do mês — dá pra ajustar
// aqui se quiser ficar mais ou menos sensível
const DEBT_WARNING_RATIO = 0.7; // 70% da renda em despesas já acende o alerta
const SAVINGS_GOOD_RATIO = 0.2; // economizar 20%+ da renda é destacado como positivo
const DAYS_AHEAD_FOR_INSTALLMENTS = 5;

export function AlertsPanel({
  totalIncome,
  totalExpenses,
  balance,
}: {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}) {
  const [upcomingInstallments, setUpcomingInstallments] = useState<Transaction[]>([]);

  useEffect(() => {
    // isso é independente do mês que a pessoa tá olhando no painel — é
    // sempre baseado na data real de hoje, então busca separado
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + DAYS_AHEAD_FOR_INSTALLMENTS);

    fetch(`/api/transactions?startDate=${today.toISOString()}&endDate=${limit.toISOString()}`)
      .then((r) => r.json())
      .then((data: Transaction[]) => {
        setUpcomingInstallments(data.filter((t) => t.installmentTotal != null));
      });
  }, []);

  const alerts: Alert[] = [];

  if (totalIncome > 0) {
    const expenseRatio = totalExpenses / totalIncome;
    const savingsRatio = balance / totalIncome;

    if (totalExpenses > totalIncome) {
      alerts.push({
        icon: AlertOctagon,
        message: `Você gastou ${formatCurrency(totalExpenses - totalIncome)} a mais do que recebeu este mês.`,
        className: 'bg-red/10 text-red border-red/20',
      });
    } else if (expenseRatio >= DEBT_WARNING_RATIO) {
      alerts.push({
        icon: AlertTriangle,
        message: `Você está usando ${Math.round(expenseRatio * 100)}% da sua renda em despesas. Considere reduzir gastos.`,
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      });
    } else if (savingsRatio >= SAVINGS_GOOD_RATIO) {
      alerts.push({
        icon: PartyPopper,
        message: `Boa! Você guardou ${Math.round(savingsRatio * 100)}% da sua renda este mês.`,
        className: 'bg-green/10 text-green border-green/20',
      });
    }
  }

  if (upcomingInstallments.length > 0) {
    const label =
      upcomingInstallments.length === 1
        ? `A parcela "${upcomingInstallments[0].description}" vence em ${formatDate(upcomingInstallments[0].date)}.`
        : `Você tem ${upcomingInstallments.length} parcelas vencendo nos próximos ${DAYS_AHEAD_FOR_INSTALLMENTS} dias.`;
    alerts.push({
      icon: CalendarClock,
      message: label,
      className: 'bg-accent/10 text-accent border-accent/20',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className={`flex items-start gap-2.5 text-sm rounded-lg border px-4 py-3 ${alert.className}`}>
          <alert.icon size={17} className="shrink-0 mt-0.5" />
          <p>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
