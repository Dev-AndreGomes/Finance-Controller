export async function register() {
  // Roda uma vez quando o servidor sobe (dev e produção). Melhor falhar aqui,
  // de forma clara, do que deixar o Better Auth assinar sessão com segredo
  // vazio/indefinido em produção sem ninguém perceber.
  if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET precisa estar definido em produção.');
  }
}
