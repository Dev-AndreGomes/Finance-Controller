'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Pencil,
  Plus,
  Repeat,
  Settings2,
  Trash2,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Category, FixedExpenseTemplate, MonthlyPlan, Transaction } from '@/types';
import { Card, Modal, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/ui';
import { AnimatedAmount } from '@/components/AnimatedAmount';
import { formatCurrency, formatDate, MONTH_NAMES } from '@/lib/format';

type Tab = 'INCOME' | 'FIXED' | 'VARIABLE';

const TAB_CONFIG: Record<Tab, { label: string; addLabel: string; empty: string }> = {
  INCOME: { label: 'Receita', addLabel: 'Nova receita', empty: 'Sem receitas neste mês ainda.' },
  FIXED: { label: 'Despesa fixa', addLabel: 'Nova despesa fixa', empty: 'Sem despesas fixas neste mês ainda.' },
  VARIABLE: {
    label: 'Despesa variável',
    addLabel: 'Nova despesa variável',
    empty: 'Sem despesas variáveis neste mês ainda.',
  },
};

const DONUT_COLORS = ['#1A237E', '#C8402F', '#1A8F5C', '#7F77DD', '#378ADD', '#D4537E'];
const INVEST_PRESETS = [10, 20, 30, 50];

function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export default function PainelPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [hideValues, setHideValues] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('FIXED');

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plan, setPlan] = useState<MonthlyPlan>({ month, year, investPercentage: 0, confirmed: false });
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showNewFixedModal, setShowNewFixedModal] = useState(false);
  const [showManageFixedModal, setShowManageFixedModal] = useState(false);

  async function load() {
    const { start, end } = monthRange(month, year);
    const [catRes, txRes, planRes] = await Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch(`/api/transactions?startDate=${start.toISOString()}&endDate=${end.toISOString()}`).then((r) =>
        r.json(),
      ),
      fetch(`/api/plans?month=${month}&year=${year}`).then((r) => r.json()),
    ]);
    setCategories(catRes);
    setTransactions(txRes);
    setPlan(planRes);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const incomeList = useMemo(() => transactions.filter((t) => t.type === 'INCOME'), [transactions]);
  const fixedList = useMemo(
    () => transactions.filter((t) => t.type === 'EXPENSE' && t.subtype === 'FIXED'),
    [transactions],
  );
  const variableList = useMemo(
    () => transactions.filter((t) => t.type === 'EXPENSE' && t.subtype !== 'FIXED'),
    [transactions],
  );

  const totalIncome = incomeList.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalFixed = fixedList.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalVariable = variableList.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = totalFixed + totalVariable;
  const investedAmount = (totalIncome * plan.investPercentage) / 100;
  const balance = totalIncome - totalExpenses - investedAmount;

  const listByTab: Record<Tab, Transaction[]> = {
    INCOME: incomeList,
    FIXED: fixedList,
    VARIABLE: variableList,
  };
  const activeList = listByTab[activeTab];

  const donutData = useMemo(() => {
    const groups = new Map<string, number>();
    for (const t of activeList) {
      const label = activeTab === 'FIXED' ? t.description : t.category?.name ?? 'Sem categoria';
      groups.set(label, (groups.get(label) ?? 0) + parseFloat(t.amount));
    }
    return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
  }, [activeList, activeTab]);

  async function handleDeleteTransaction(id: string) {
    if (!confirm('Excluir este lançamento?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="text-muted">Carregando painel…</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium">Orçamento</h1>
            <button
              onClick={() => setHideValues((v) => !v)}
              className="text-muted hover:text-ink transition-colors"
              aria-label="Ocultar valores"
            >
              {hideValues ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-sm text-muted mt-1">Seu resumo financeiro do mês</p>
        </div>

        <div className="flex items-center gap-1 bg-surface border border-line rounded-lg px-2 py-1.5">
          <button onClick={goToPreviousMonth} className="text-muted hover:text-ink p-1" aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm px-2 min-w-[9rem] text-center">
            {MONTH_NAMES[month - 1]} de {year}
          </span>
          <button onClick={goToNextMonth} className="text-muted hover:text-ink p-1" aria-label="Próximo mês">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Receita</p>
          <AnimatedAmount
            value={totalIncome}
            hidden={hideValues}
            className="block font-mono text-xl mt-2 font-tabular text-green"
          />
        </Card>
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-1">
            <p className="text-xs uppercase tracking-wide text-muted">Investir</p>
            <button
              onClick={() => setShowInvestModal(true)}
              className="text-[10px] uppercase tracking-wide bg-accent/10 text-accent rounded-full px-2 py-0.5 flex items-center gap-1 hover:bg-accent/20 transition-colors"
            >
              <Settings2 size={10} /> Ajustar
            </button>
          </div>
          <AnimatedAmount
            value={investedAmount}
            hidden={hideValues}
            className="block font-mono text-xl mt-2 font-tabular text-accent"
          />
          <div className="flex items-center gap-1 mt-1">
            {plan.confirmed ? (
              <CheckCircle2 size={12} className="text-green" />
            ) : (
              <Circle size={12} className="text-muted" />
            )}
            <p className="text-[11px] text-muted">
              {plan.investPercentage}% da receita · {plan.confirmed ? 'confirmado' : 'simulação'}
            </p>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Despesas</p>
          <AnimatedAmount
            value={totalExpenses}
            hidden={hideValues}
            className="block font-mono text-xl mt-2 font-tabular text-red"
          />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Saldo</p>
          <AnimatedAmount value={balance} hidden={hideValues} className="block font-mono text-xl mt-2 font-tabular" />
        </Card>
      </div>

      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activeTab === tab ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {TAB_CONFIG[tab].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line">
            <p className="text-sm font-medium">
              {activeTab === 'INCOME' ? 'Receitas' : activeTab === 'FIXED' ? 'Despesas fixas' : 'Despesas variáveis'}
            </p>
            <button
              onClick={() => {
                if (activeTab === 'FIXED') {
                  setShowNewFixedModal(true);
                } else {
                  setEditingTransaction(null);
                  setShowAddModal(true);
                }
              }}
              className={`${primaryButtonClass} !py-1.5 !px-3 text-xs`}
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>

          {activeList.length === 0 ? (
            <p className="text-muted text-sm p-6">{TAB_CONFIG[activeTab].empty}</p>
          ) : (
            <AnimatePresence initial={false}>
              {activeList.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="entry-row flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {formatDate(tx.date)}
                      {tx.category ? ` · ${tx.category.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-sm font-tabular whitespace-nowrap ${
                        activeTab === 'INCOME' ? 'text-green' : 'text-red'
                      }`}
                    >
                      {hideValues ? '••••••' : formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingTransaction(tx);
                        setShowAddModal(true);
                      }}
                      className="text-muted hover:text-accent transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-muted hover:text-red transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col items-center justify-center min-h-[280px]">
          {donutData.length === 0 ? (
            <div className="text-center text-muted">
              <Clock size={28} className="mx-auto mb-3 opacity-60" />
              <p className="text-sm">{TAB_CONFIG[activeTab].empty}</p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="var(--color-surface)" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => (hideValues ? '••••••' : formatCurrency(value))}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-line)',
                        color: 'var(--color-ink)',
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full mt-2 text-xs">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="truncate text-muted">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <Link href="/categorias" className="text-xs text-accent hover:underline mt-4 flex items-center gap-1">
            <Settings2 size={12} /> Gerenciar categorias
          </Link>
          {activeTab === 'FIXED' && (
            <button
              onClick={() => setShowManageFixedModal(true)}
              className="text-xs text-accent hover:underline mt-2 flex items-center gap-1"
            >
              <Repeat size={12} /> Gerenciar despesas fixas recorrentes
            </button>
          )}
        </Card>
      </div>

      {showAddModal && (
        <AddTransactionModal
          tab={activeTab}
          categories={categories}
          date={new Date(Date.UTC(year, month - 1, Math.min(today.getDate(), 28)))}
          editingTransaction={editingTransaction}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
          onSaved={(saved) => {
            setShowAddModal(false);
            setEditingTransaction(null);
            const savedDate = new Date(saved.date);
            const savedMonth = savedDate.getUTCMonth() + 1;
            const savedYear = savedDate.getUTCFullYear();
            if (savedMonth !== month || savedYear !== year) {
              // The lançamento belongs to a different month than the one being
              // viewed — jump there so it's obviously visible instead of just
              // disappearing from the current list (which looks like it failed).
              setMonth(savedMonth);
              setYear(savedYear);
            } else {
              load();
            }
          }}
        />
      )}

      {showInvestModal && (
        <InvestModal
          plan={plan}
          totalIncome={totalIncome}
          onClose={() => setShowInvestModal(false)}
          onSaved={(updated) => {
            setPlan(updated);
            setShowInvestModal(false);
          }}
        />
      )}

      {showNewFixedModal && (
        <NewFixedExpenseModal
          month={month}
          year={year}
          onClose={() => setShowNewFixedModal(false)}
          onSaved={() => {
            setShowNewFixedModal(false);
            load();
          }}
        />
      )}

      {showManageFixedModal && <ManageFixedTemplatesModal onClose={() => setShowManageFixedModal(false)} onChanged={load} />}
    </div>
  );
}

function AddTransactionModal({
  tab,
  categories,
  date,
  editingTransaction,
  onClose,
  onSaved,
}: {
  tab: Tab;
  categories: Category[];
  date: Date;
  editingTransaction: Transaction | null;
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
}) {
  const [description, setDescription] = useState(editingTransaction?.description ?? '');
  const [amount, setAmount] = useState(editingTransaction?.amount ?? '');
  const [txDate, setTxDate] = useState(
    editingTransaction ? editingTransaction.date.slice(0, 10) : date.toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const relevantCategories = categories.filter((c) => (tab === 'INCOME' ? c.kind === 'INCOME' : c.kind === 'EXPENSE'));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        description,
        amount: parseFloat(amount),
        type: tab === 'INCOME' ? 'INCOME' : 'EXPENSE',
        subtype: tab === 'FIXED' ? 'FIXED' : tab === 'VARIABLE' ? 'VARIABLE' : undefined,
        date: new Date(txDate).toISOString(),
        categoryId: tab === 'FIXED' ? undefined : categoryId || undefined,
      };

      const res = await fetch(
        editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions',
        {
          method: editingTransaction ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Não foi possível salvar.');
      }
      const saved: Transaction = await res.json();
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editingTransaction ? 'Editar lançamento' : TAB_CONFIG[tab].addLabel} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red text-sm">{error}</p>}

        <div>
          <label className="text-xs text-muted uppercase tracking-wide">Descrição</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="Ex: Mercado, Salário, Aluguel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">
              {tab === 'FIXED' ? 'Vencimento' : 'Data'}
            </label>
            <input
              type="date"
              required
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        {tab !== 'FIXED' && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">
              {tab === 'INCOME' ? 'Tipo de renda' : 'Categoria'}
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} mt-1`}>
              <option value="">Sem categoria</option>
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {editingTransaction ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewFixedExpenseModal({
  month,
  year,
  onClose,
  onSaved,
}: {
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('10');
  const [repeats, setRepeats] = useState(true);
  const [hasEnd, setHasEnd] = useState(false);
  const [endMonth, setEndMonth] = useState(month);
  const [endYear, setEndYear] = useState(year);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/fixed-expense-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          dayOfMonth: parseInt(dayOfMonth, 10),
          startMonth: month,
          startYear: year,
          repeats,
          endMonth: repeats && hasEnd ? endMonth : null,
          endYear: repeats && hasEnd ? endYear : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Não foi possível salvar.');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova despesa fixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red text-sm">{error}</p>}

        <div>
          <label className="text-xs text-muted uppercase tracking-wide">Descrição</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="Ex: Aluguel, Internet, Academia"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">Dia do vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <p className="text-[11px] text-muted">
          Vai valer a partir de {MONTH_NAMES[month - 1]} de {year}.
        </p>

        <label className="flex items-center gap-2 text-sm bg-surface-alt rounded-lg px-3 py-2.5">
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
            className="accent-accent"
          />
          Repetir todo mês
        </label>

        {repeats && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!hasEnd}
                onChange={() => setHasEnd(false)}
                className="accent-accent"
              />
              Sem data de término
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={hasEnd} onChange={() => setHasEnd(true)} className="accent-accent" />
              Até um mês específico
            </label>
            {hasEnd && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(parseInt(e.target.value, 10))}
                  className={inputClass}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            Adicionar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageFixedTemplatesModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [templates, setTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/fixed-expense-templates');
    setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStop(template: FixedExpenseTemplate) {
    const now = new Date();
    if (!confirm(`Parar de repetir "${template.description}" a partir de agora?`)) return;
    await fetch(`/api/fixed-expense-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endMonth: now.getMonth() + 1, endYear: now.getFullYear() }),
    });
    load();
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir essa despesa fixa recorrente? Os meses já lançados continuam no histórico.')) return;
    await fetch(`/api/fixed-expense-templates/${id}`, { method: 'DELETE' });
    load();
    onChanged();
  }

  return (
    <Modal title="Despesas fixas recorrentes" onClose={onClose}>
      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma despesa fixa recorrente cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const isEnded = t.endMonth != null && t.endYear != null;
            return (
              <div key={t.id} className="border border-line rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatCurrency(t.amount)} · todo dia {t.dayOfMonth}
                      {isEnded ? ` · até ${MONTH_NAMES[t.endMonth! - 1]}/${t.endYear}` : ' · sem data de término'}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-muted hover:text-red transition-colors" aria-label="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
                {!isEnded && (
                  <button
                    onClick={() => handleStop(t)}
                    className="text-xs text-accent hover:underline mt-2"
                  >
                    Parar de repetir a partir de agora
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-end pt-5">
        <button type="button" className={secondaryButtonClass} onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}

function InvestModal({
  plan,
  totalIncome,
  onClose,
  onSaved,
}: {
  plan: MonthlyPlan;
  totalIncome: number;
  onClose: () => void;
  onSaved: (plan: MonthlyPlan) => void;
}) {
  const [percentage, setPercentage] = useState(plan.investPercentage);
  const [confirmed, setConfirmed] = useState(plan.confirmed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = (totalIncome * percentage) / 100;

  function handleAmountChange(value: string) {
    const parsed = parseFloat(value || '0');
    if (totalIncome > 0) {
      setPercentage(Math.min(100, Math.max(0, (parsed / totalIncome) * 100)));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: plan.month,
          year: plan.year,
          investPercentage: Math.round(percentage * 100) / 100,
          confirmed,
        }),
      });
      if (!res.ok) throw new Error('Não foi possível salvar.');
      const data = await res.json();
      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Simular investimento" onClose={onClose}>
      <p className="text-sm text-muted -mt-2 mb-4">Quanto da sua receita você planeja reservar esse mês.</p>
      {error && <p className="text-red text-sm mb-2">{error}</p>}

      <p className="text-center font-mono text-2xl text-accent">{Math.round(percentage)}%</p>
      <input
        type="range"
        min={0}
        max={100}
        value={percentage}
        onChange={(e) => setPercentage(parseFloat(e.target.value))}
        className="w-full mt-3 accent-accent"
      />

      <div className="flex gap-2 mt-4">
        {INVEST_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPercentage(p)}
            className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${
              Math.round(percentage) === p
                ? 'bg-accent text-accent-contrast border-accent'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label className="text-xs text-muted uppercase tracking-wide">Valor a investir</label>
        <input
          type="number"
          step="0.01"
          value={amount.toFixed(2)}
          onChange={(e) => handleAmountChange(e.target.value)}
          className={`${inputClass} mt-1 text-center font-mono text-lg`}
          disabled={totalIncome === 0}
        />
        <p className="text-[11px] text-muted mt-1 text-center">
          Toque no valor pra digitar. O percentual se ajusta sozinho.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm mt-5 bg-surface-alt rounded-lg px-3 py-2.5">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="accent-accent"
        />
        Já investi esse valor esse mês
      </label>

      <div className="flex justify-end gap-2 pt-5">
        <button type="button" className={secondaryButtonClass} onClick={onClose}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} className={primaryButtonClass}>
          Salvar
        </button>
      </div>
    </Modal>
  );
}
