# 💰 Finance Controller

Controle financeiro pessoal simples, mês a mês: quanto entrou, quanto você tem pra pagar, quanto
sobra — com simulação de investimento e histórico para comparar a evolução entre os meses.

Pensado para ser o que a maioria das pessoas monta no Excel, só que mais rápido e sem trabalho manual.


---

## ✨ Funcionalidades

- **Receitas, despesas fixas e variáveis** organizadas por mês, com navegação entre meses
- **Despesas fixas recorrentes**: cadastra uma vez (aluguel, assinaturas, etc.) e ela aparece
  sozinha nos meses seguintes — sem precisar recadastrar
- **Simulação de investimento**: define um percentual da receita, vê o valor na hora, e confirma
  se realmente investiu naquele mês
- **Histórico**: gráfico e tabela comparando o saldo mês a mês, desde a criação da conta
- **Categorias** simples para organizar despesas e receitas
- **Modo claro/escuro**
- **Totalmente responsivo** (funciona bem no celular)
- Autenticação própria com sessão em cookie seguro (sem tokens em `localStorage`)

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, front + back no mesmo projeto) |
| Banco de dados | [PostgreSQL](https://www.postgresql.org) via [Neon](https://neon.tech) (serverless) |
| ORM | [Prisma](https://www.prisma.io) |
| Autenticação | [Better Auth](https://www.better-auth.com) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com) |
| Gráficos | [Recharts](https://recharts.org) |
| Animações | [Framer Motion](https://www.framer.com/motion) |
| Validação | [Zod](https://zod.dev) |

Projeto desenhado para caber inteiro em **um único deploy na Vercel** — sem Docker, sem servidor
separado para gerenciar o backend.

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js 20+
- Uma conta gratuita no [Neon](https://neon.tech)

### Passo a passo

1. Clone o repositório e instale as dependências:
```bash
   git clone https://github.com/seu-usuario/finance-controller.git
   cd finance-controller
   npm install
```

2. Crie um projeto no [Neon](https://neon.tech) e copie a **connection string** (a versão
   `-pooler`).

3. Configure o `.env`:
```bash
   cp .env.example .env
```
   Preencha:
   - `DATABASE_URL` → a connection string do Neon
   - `BETTER_AUTH_SECRET` → gere uma com:
```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
   - `BETTER_AUTH_URL` → deixe `http://localhost:3000`

4. Crie as tabelas no banco:
```bash
   npx prisma migrate dev --name init
```

5. Rode o projeto:
```bash
   npm run dev
```

Acesse `http://localhost:3000`, crie uma conta e comece a usar.

## ☁️ Deploy na Vercel

1. Importe o repositório na [Vercel](https://vercel.com).
2. Adicione a integração do Neon: **Storage → Add Integration → Neon** (preenche `DATABASE_URL`
   sozinho).
3. Configure as variáveis de ambiente restantes:
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` → a URL do seu deploy
4. Depois do primeiro deploy, rode a migração contra o banco de produção:
```bash
   npx prisma migrate deploy
```

## 📁 Estrutura do projeto

src/
app/
page.tsx → landing pública
login/, registro/ → autenticação
(app)/ → rotas protegidas
painel/ → dashboard principal
historico/ → comparação mês a mês
categorias/ → gerenciar categorias
api/ → rotas da API (transações, categorias, plano de investimento, histórico)
lib/ → Prisma, Better Auth, validação (Zod)
components/ → componentes de UI reutilizáveis
prisma/schema.prisma → modelo de dados


## 🔒 Segurança

- Sessão via cookie `httpOnly` (Better Auth) — nunca em `localStorage`
- Toda rota de API confere que o recurso pertence ao usuário autenticado
- Validação de entrada com Zod em todas as rotas
- Hash de senha gerenciado pelo Better Auth

## 📝 Licença

Este projeto está sob a licença MIT — sinta-se à vontade para usar como referência.
