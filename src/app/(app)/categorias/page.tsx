'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, Modal, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/ui';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { Category, TransactionType } from '@/types';

const SWATCHES = ['#1A237E', '#1A8F5C', '#C8402F', '#7F77DD', '#378ADD', '#D4537E'];

export default function CategoriasPage() {
  const showToast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(SWATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  async function load() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setKind('EXPENSE');
    setColor(SWATCHES[0]);
    setError(null);
    setShowModal(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setKind(c.kind);
    setColor(c.color ?? SWATCHES[0]);
    setError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/categories/${editing.id}` : '/api/categories', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kind, color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Não foi possível salvar.');
      }
      setShowModal(false);
      load();
      showToast('success', editing ? 'Categoria atualizada!' : 'Categoria criada!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Não foi possível excluir.');
      load();
      showToast('success', 'Categoria excluída.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Não foi possível excluir.');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) return <p className="text-muted">Carregando categorias…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-medium">Categorias</h1>
          <p className="text-sm text-muted mt-1">Etiquetas simples para organizar seus lançamentos</p>
        </div>
        <button className={primaryButtonClass} onClick={openCreate}>
          <Plus size={15} /> Nova categoria
        </button>
      </div>

      <Card className="p-0">
        {categories.length === 0 ? (
          <p className="text-muted text-sm p-6">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="entry-row flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: c.color ?? 'var(--color-muted)' }} />
                <span className="text-sm truncate">{c.name}</span>
                <span className="text-xs text-muted shrink-0">{c.kind === 'EXPENSE' ? 'Despesa' : 'Receita'}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => openEdit(c)} className="text-muted hover:text-accent transition-colors" aria-label="Editar">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(c)} className="text-muted hover:text-red transition-colors" aria-label="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      {showModal && (
        <Modal title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red text-sm">{error}</p>}
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Nome</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} mt-1`}
                placeholder="Ex: Mercado, Transporte, Lazer"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Tipo</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as TransactionType)} className={`${inputClass} mt-1`}>
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Cor</label>
              <div className="flex gap-2 mt-2">
                {SWATCHES.map((sw) => (
                  <button
                    type="button"
                    key={sw}
                    onClick={() => setColor(sw)}
                    className="w-7 h-7 rounded-full border-2"
                    style={{ backgroundColor: sw, borderColor: color === sw ? 'var(--color-ink)' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {editing ? 'Salvar' : 'Criar categoria'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir categoria"
          options={[{ label: 'Excluir', value: 'confirm', variant: 'danger' }]}
          onSelect={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
