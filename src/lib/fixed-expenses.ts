import type { FixedExpenseTemplate } from '@prisma/client';
import { prisma } from './prisma';

function monthKey(month: number, year: number) {
  return year * 12 + month;
}

function daysInMonth(month: number, year: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Garante que toda despesa fixa recorrente ativa tenha uma Transaction de
 * verdade criada pro mês pedido — cria as que estiverem faltando. Pode
 * chamar quantas vezes quiser, se já existir não faz nada de novo.
 *
 * Chamado tanto no GET /api/transactions (pra aparecer quando abre o mês)
 * quanto no GET /api/history (senão um mês que a pessoa nunca visitou no
 * painel ficaria errado no gráfico de histórico).
 */
export async function ensureFixedExpenseInstances(userId: string, month: number, year: number) {
  const templates = await prisma.fixedExpenseTemplate.findMany({ where: { userId } });
  if (templates.length === 0) return;

  const targetKey = monthKey(month, year);

  const activeTemplates = templates.filter((t: FixedExpenseTemplate) => {
    const startKey = monthKey(t.startMonth, t.startYear);
    if (targetKey < startKey) return false;
    if (t.endMonth != null && t.endYear != null) {
      const endKey = monthKey(t.endMonth, t.endYear);
      if (targetKey > endKey) return false;
    }
    return true;
  });
  if (activeTemplates.length === 0) return;

  // Se o usuário excluiu só a ocorrência desse mês específico, não recria.
  const skips = await prisma.fixedExpenseSkip.findMany({
    where: {
      month,
      year,
      templateId: { in: activeTemplates.map((t: FixedExpenseTemplate) => t.id) },
    },
    select: { templateId: true },
  });
  const skippedIds = new Set(skips.map((s: { templateId: string }) => s.templateId));
  const eligibleTemplates = activeTemplates.filter((t: FixedExpenseTemplate) => !skippedIds.has(t.id));
  if (eligibleTemplates.length === 0) return;

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const existingForMonth = await prisma.transaction.findMany({
    where: {
      userId,
      templateId: { in: eligibleTemplates.map((t: FixedExpenseTemplate) => t.id) },
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { templateId: true },
  });
  const alreadyMaterialized = new Set(existingForMonth.map((t: { templateId: string | null }) => t.templateId));

  const toCreate = eligibleTemplates.filter((t: FixedExpenseTemplate) => !alreadyMaterialized.has(t.id));
  if (toCreate.length === 0) return;

  await prisma.transaction.createMany({
    data: toCreate.map((t: FixedExpenseTemplate) => ({
      description: t.description,
      amount: t.amount,
      type: 'EXPENSE' as const,
      subtype: 'FIXED' as const,
      date: new Date(Date.UTC(year, month - 1, Math.min(t.dayOfMonth, daysInMonth(month, year)))),
      userId,
      templateId: t.id,
    })),
  });
}
