'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_SHORT } from '@/lib/format';

export function MonthYearPicker({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // fecha o popover se clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function openPicker() {
    setPickerYear(year);
    setOpen(true);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPicker}
        className="text-sm px-2 py-1.5 min-w-[9rem] flex items-center justify-center gap-1.5 hover:text-accent transition-colors"
      >
        {MONTH_SHORT[month - 1]} de {year}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-xl shadow-[var(--shadow-card)] p-3 z-20 w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setPickerYear((y) => y - 1)}
              className="text-muted hover:text-ink p-1"
              aria-label="Ano anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-medium">{pickerYear}</span>
            <button
              onClick={() => setPickerYear((y) => y + 1)}
              className="text-muted hover:text-ink p-1"
              aria-label="Próximo ano"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT.map((label, i) => {
              const isSelected = i + 1 === month && pickerYear === year;
              return (
                <button
                  key={label}
                  onClick={() => {
                    onChange(i + 1, pickerYear);
                    setOpen(false);
                  }}
                  className={`text-xs py-2 rounded-lg transition-colors ${
                    isSelected ? 'bg-accent text-accent-contrast' : 'hover:bg-surface-alt text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
