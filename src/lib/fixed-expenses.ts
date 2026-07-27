import type { FixedExpenseTemplate } from '@prisma/client';
import { prisma } from './prisma';

function monthKey(month: number, year: number) {
  return year * 12 + month;
}

function daysInMonth(month: number, year: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Ensures every active recurring fixed-expense template has a real Transaction
 * row for the given month, creating any that are missing. Safe to call
 * repeatedly — it's a no-op once a month's instance already exists.
 *
 * Called from both GET /api/transactions (so opening a month shows it) and
 * GET /api/history (so months you never manually visited still count
 * correctly in the trend chart).
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

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const existingForMonth = await prisma.transaction.findMany({
    where: {
      userId,
      templateId: { in: activeTemplates.map((t: FixedExpenseTemplate) => t.id) },
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { templateId: true },
  });
  const alreadyMaterialized = new Set(existingForMonth.map((t: { templateId: string | null }) => t.templateId));

  const toCreate = activeTemplates.filter((t: FixedExpenseTemplate) => !alreadyMaterialized.has(t.id));
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
