'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CheckCircle2, Circle, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { MonthHistory } from '@/types';
import { formatCurrency, MONTH_SHORT } from '@/lib/format';

export default function HistoricoPage() {
  const [history, setHistory] = useState<MonthHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history?months=12')
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-muted">Carregando histórico…</p>;

  const chartData = history.map((h) => ({
    label: `${MONTH_SHORT[h.month - 1]}/${String(h.year).slice(2)}`,
    saldo: h.balance,
  }));

  const monthsWithData = history.filter((h) => h.totalIncome > 0 || h.totalExpenses > 0);
  const last = monthsWithData[monthsWithData.length - 1];
  const previous = monthsWithData[monthsWithData.length - 2];
  const delta = last && previous ? last.balance - previous.balance : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Histórico</h1>
        <p className="text-sm text-muted mt-1">Como seu saldo evoluiu mês a mês</p>
      </div>

      {delta !== null && (
        <Card className="flex items-center gap-3">
          {delta >= 0 ? <TrendingUp size={20} className="text-green" /> : <TrendingDown size={20} className="text-red" />}
          <p className="text-sm">
            Seu saldo {delta >= 0 ? 'melhorou' : 'piorou'} em{' '}
            <span className={`font-mono font-tabular ${delta >= 0 ? 'text-green' : 'text-red'}`}>
              {formatCurrency(Math.abs(delta))}
            </span>{' '}
            em relação ao mês anterior.
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm font-medium mb-4">Saldo por mês</p>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-ink)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.saldo >= 0 ? 'var(--color-accent)' : 'var(--color-red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-4 sm:px-6 py-3 text-xs text-muted uppercase tracking-wide border-b border-line">
          <span>Mês</span>
          <span className="text-right">Receita</span>
          <span className="text-right">Despesas</span>
          <span className="text-right">Saldo</span>
          <span className="text-right">Investimento</span>
        </div>
        {history
          .slice()
          .reverse()
          .map((h) => (
            <div
              key={`${h.month}-${h.year}`}
              className="entry-row grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-4 sm:px-6 py-3 text-sm items-center"
            >
              <span>
                {MONTH_SHORT[h.month - 1]}/{h.year}
              </span>
              <span className="text-right font-mono font-tabular text-green">{formatCurrency(h.totalIncome)}</span>
              <span className="text-right font-mono font-tabular text-red">{formatCurrency(h.totalExpenses)}</span>
              <span className={`text-right font-mono font-tabular ${h.balance >= 0 ? '' : 'text-red'}`}>
                {formatCurrency(h.balance)}
              </span>
              <span className="flex items-center justify-end gap-1 text-xs text-muted">
                {h.invested > 0 &&
                  (h.investConfirmed ? (
                    <CheckCircle2 size={12} className="text-green" />
                  ) : (
                    <Circle size={12} />
                  ))}
                {formatCurrency(h.invested)}
              </span>
            </div>
          ))}
      </Card>
    </div>
  );
}
