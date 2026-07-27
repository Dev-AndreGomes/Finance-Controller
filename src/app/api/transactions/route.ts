import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createTransactionSchema } from '@/lib/validation';
import { badRequest, serverError, unauthorized } from '@/lib/api-utils';
import { ensureFixedExpenseInstances } from '@/lib/fixed-expenses';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If the requested range is exactly one calendar month (how the Painel
    // always calls this), make sure any active recurring fixed expense has
    // a real row for it before we read the list back.
    if (startDate) {
      const start = new Date(startDate);
      await ensureFixedExpenseInstances(user.id, start.getUTCMonth() + 1, start.getUTCFullYear());
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lt: endDate ? new Date(endDate) : undefined,
        },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const dto = createTransactionSchema.parse(body);

    if (dto.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category || category.userId !== user.id) {
        return badRequest(new Error('Categoria inválida'));
      }
    }

    const isInstallmentPurchase =
      dto.type === 'EXPENSE' && dto.isInstallment && dto.installmentTotal && dto.installmentTotal >= 2;

    if (isInstallmentPurchase) {
      const n = dto.installmentTotal!;
      const total = new Prisma.Decimal(dto.amount);
      // Round each parcela down to cents, then dump the leftover cents (from
      // rounding) onto the last parcela — so the parcelas always sum to
      // exactly the total, never a cent more or less.
      const base = total.dividedBy(n).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
      const remainder = total.minus(base.times(n));
      const groupId = randomUUID();
      const firstDate = new Date(dto.date);

      const rows = Array.from({ length: n }, (_, i) => {
        const amount = i === n - 1 ? base.plus(remainder) : base;
        const targetYear = firstDate.getUTCFullYear();
        const targetMonth = firstDate.getUTCMonth() + i;
        const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        const day = Math.min(firstDate.getUTCDate(), daysInTargetMonth);
        const date = new Date(Date.UTC(targetYear, targetMonth, day));
        return {
          description: dto.description,
          amount,
          type: 'EXPENSE' as const,
          subtype: 'VARIABLE' as const,
          date,
          categoryId: dto.categoryId ?? undefined,
          userId: user.id,
          installmentGroupId: groupId,
          installmentNumber: i + 1,
          installmentTotal: n,
        };
      });

      await prisma.transaction.createMany({ data: rows });
      const created = await prisma.transaction.findMany({
        where: { installmentGroupId: groupId },
        include: { category: true },
        orderBy: { installmentNumber: 'asc' },
      });

      return NextResponse.json(created, { status: 201 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        subtype: dto.type === 'EXPENSE' ? (dto.subtype ?? 'VARIABLE') : undefined,
        date: new Date(dto.date),
        categoryId: dto.categoryId ?? undefined,
        userId: user.id,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
