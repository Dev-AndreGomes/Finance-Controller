'use client';

import { useEffect, useRef, useState } from 'react';
import { Filter } from 'lucide-react';
import { Category, PaymentMethod } from '@/types';
import { inputClass, secondaryButtonClass } from './ui';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/payment-methods';

export interface ListFilterState {
  categoryId: string;
  paymentMethod: PaymentMethod | '';
  status: 'ALL' | 'PAID' | 'PENDING';
}

export const EMPTY_FILTERS: ListFilterState = { categoryId: '', paymentMethod: '', status: 'ALL' };

export function ListFilters({
  categories,
  showCategoryFilter,
  showPaymentFilters,
  value,
  onChange,
}: {
  categories: Category[];
  showCategoryFilter: boolean;
  showPaymentFilters: boolean;
  value: ListFilterState;
  onChange: (filters: ListFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isActive = value.categoryId !== '' || value.paymentMethod !== '' || value.status !== 'ALL';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs relative`}>
        <Filter size={13} /> Filtro
        {isActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />}
      </button>

      {open && (
        <div className="fixed bg-surface border border-line rounded-xl shadow-[var(--shadow-card)] p-4 z-50 w-64 space-y-3">
          {showCategoryFilter && (
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Categoria</label>
              <select
                value={value.categoryId}
                onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
                className={`${inputClass} mt-1`}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showPaymentFilters && (
            <>
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Forma de pagamento</label>
                <select
                  value={value.paymentMethod}
                  onChange={(e) => onChange({ ...value, paymentMethod: e.target.value as PaymentMethod | '' })}
                  className={`${inputClass} mt-1`}
                >
                  <option value="">Todas</option>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Status</label>
                <select
                  value={value.status}
                  onChange={(e) => onChange({ ...value, status: e.target.value as ListFilterState['status'] })}
                  className={`${inputClass} mt-1`}
                >
                  <option value="ALL">Todos</option>
                  <option value="PAID">Pago</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </>
          )}

          {isActive && (
            <button onClick={() => onChange(EMPTY_FILTERS)} className="text-xs text-accent hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
