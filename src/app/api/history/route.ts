import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { serverError, unauthorized } from '@/lib/api-utils';
import { ensureFixedExpenseInstances } from '@/lib/fixed-expenses';

function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { createdAt: true } });
    const accountCreatedAt = dbUser?.createdAt ?? new Date();
    const firstMonthStart = new Date(Date.UTC(accountCreatedAt.getUTCFullYear(), accountCreatedAt.getUTCMonth(), 1));

    const { searchParams } = new URL(request.url);
    const monthsCount = Math.min(24, Math.max(1, parseInt(searchParams.get('months') ?? '6', 10)));

    const now = new Date();
    const months: { month: number; year: number }[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      // Never show a month before the account was created (there's no real
      // data for it, so it would just show up as a confusing empty zero row).
      if (d < firstMonthStart) continue;
      months.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
    }

    const results = await Promise.all(
      months.map(async ({ month, year }) => {
        await ensureFixedExpenseInstances(user.id, month, year);
        const { start, end } = monthRange(month, year);

        const [incomeAgg, expenseAgg, plan] = await Promise.all([
          prisma.transaction.aggregate({
            where: { userId: user.id, type: 'INCOME', date: { gte: start, lt: end } },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { userId: user.id, type: 'EXPENSE', date: { gte: start, lt: end } },
            _sum: { amount: true },
          }),
          prisma.monthlyPlan.findUnique({
            where: { userId_month_year: { userId: user.id, month, year } },
          }),
        ]);

        const totalIncome = incomeAgg._sum.amount?.toNumber() ?? 0;
        const totalExpenses = expenseAgg._sum.amount?.toNumber() ?? 0;
        const investPercentage = plan?.investPercentage.toNumber() ?? 0;
        const invested = (totalIncome * investPercentage) / 100;
        const balance = totalIncome - totalExpenses - invested;

        return {
          month,
          year,
          totalIncome,
          totalExpenses,
          invested,
          investConfirmed: plan?.confirmed ?? false,
          balance,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    return serverError(error);
  }
}
