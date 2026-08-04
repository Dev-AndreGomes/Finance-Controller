import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // já loga a pessoa direto depois de criar a conta — um passo a menos
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova o cookie a cada dia de uso
  },
  // Proteção contra força bruta em login/cadastro. Fica em memória (não
  // precisa de tabela nova no banco) — suficiente pro tamanho desse app; se
  // um dia crescer muito e rodar em várias instâncias ao mesmo tempo, dá pra
  // trocar storage pra "database" (exige gerar uma tabela nova via
  // `npx @better-auth/cli generate`).
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 10 },
    },
  },
  // tem que ser o último plugin — é ele que permite setar cookie em Server Action/Route Handler
  plugins: [nextCookies()],
});
