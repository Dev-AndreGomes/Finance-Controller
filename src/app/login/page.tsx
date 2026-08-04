'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { inputClass, primaryButtonClass } from '@/components/ui';
import { Logo } from '@/components/Logo';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn.email({ email, password });
    setLoading(false);
    if (signInError) {
      setError('Não foi possível entrar. Verifique seu e-mail e senha.');
      return;
    }
    router.push('/painel');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8 gap-2">
          <Logo height={70} />
          <p className="text-muted text-sm mt-2">Entre para continuar seu controle financeiro</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl p-6 space-y-4 shadow-[var(--shadow-card)]">
          {error && <p className="text-red text-sm">{error}</p>}
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className={`${primaryButtonClass} w-full mt-2`}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-6">
          Ainda não tem conta?{' '}
          <Link href="/registro" className="text-accent hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
