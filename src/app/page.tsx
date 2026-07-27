import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BarChart3, PiggyBank, TrendingUp } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { ThemeToggle } from '@/components/ThemeToggle';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Controle mensal simples',
    description: 'Lance receitas, despesas fixas e variáveis do mês — como uma planilha, só que mais rápida.',
  },
  {
    icon: PiggyBank,
    title: 'Simule investimentos',
    description: 'Defina quanto da sua receita planeja investir, veja o valor na hora e confirme quando fizer.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhe seu histórico',
    description: 'Compare o saldo de cada mês com o anterior e veja sua evolução financeira ao longo do tempo.',
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/painel');

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <p className="text-lg font-medium">Finance Controller</p>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
            Entrar
          </Link>
          <Link
            href="/registro"
            className="text-sm bg-accent text-accent-contrast rounded-lg px-4 py-2 font-medium hover:brightness-110 transition-all"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
            Seu dinheiro, organizado <span className="text-accent">mês a mês</span>.
          </h1>
          <p className="text-muted text-lg mt-5 leading-relaxed">
            Sem contas bancárias pra cadastrar, sem categorias complicadas. Só o que você recebeu,
            o que precisa pagar, e quanto sobra — do jeito que faria numa planilha, mas com menos trabalho.
          </p>
          <div className="flex items-center gap-3 mt-8">
            <Link
              href="/registro"
              className="bg-accent text-accent-contrast rounded-lg px-6 py-3 font-medium hover:brightness-110 transition-all"
            >
              Começar de graça
            </Link>
            <Link
              href="/login"
              className="border border-line rounded-lg px-6 py-3 font-medium hover:bg-surface-alt transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-2xl p-6 shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <f.icon size={19} className="text-accent" />
              </div>
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
