'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, History, Tags, Menu, X, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/painel', label: 'Painel', icon: LayoutDashboard },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/categorias', label: 'Categorias', icon: Tags },
];

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-surface border-b border-line flex items-center justify-between px-4 z-30">
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="text-ink">
          <Menu size={22} />
        </button>
        <p className="text-base font-medium">Finance Controller</p>
        <div className="w-[22px]" />
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`w-64 shrink-0 border-r border-line flex flex-col bg-bg
          fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="px-6 py-7 border-b border-line flex items-center justify-between">
          <div>
            <p className="text-xl font-medium tracking-tight">Finance Controller</p>
            <p className="text-xs text-muted mt-0.5">Seu controle financeiro mensal</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-line flex items-center justify-between">
          <span className="text-xs text-muted">Tema</span>
          <ThemeToggle />
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm border-l-2 transition-colors ${
                  isActive
                    ? 'border-accent text-ink bg-surface'
                    : 'border-transparent text-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-line">
          <p className="text-sm truncate">{userName}</p>
          <p className="text-xs text-muted truncate mb-3">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-wider text-accent hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
