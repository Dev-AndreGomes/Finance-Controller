import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createTransactionSchema } from '@/lib/validation';
import { badRequest, serverError, unauthorized } from '@/lib/api-utils';
import { ensureFixedExpenseInstances } from '@/lib/fixed-expenses';

// cartão de crédito nasce pendente (só quita na fatura); o resto já nasce pago
function computeIsPaid(paymentMethod: string | undefined) {
  return paymentMethod !== 'CREDIT_CARD';
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Se o intervalo pedido for exatamente um mês (é assim que o Painel
    // sempre chama isso), garante que as despesas fixas recorrentes ativas já
    // estejam geradas antes de devolver a lista.
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
      // Arredonda cada parcela pra baixo, e joga o restinho de centavos (do
      // arredondamento) na última parcela — assim elas sempre somam
      // exatamente o total, nunca um centavo a mais ou a menos.
      const base = total.dividedBy(n).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
      const remainder = total.minus(base.times(n));
      const groupId = randomUUID();
      const firstDate = new Date(dto.date);

      // Parcelamento é sempre tratado como pendente até ser pago — não
      // importa a forma de pagamento escolhida (regra do enunciado).
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
          paymentMethod: dto.paymentMethod ?? 'CREDIT_CARD',
          isPaid: false,
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
        paymentMethod: dto.type === 'EXPENSE' ? dto.paymentMethod : undefined,
        isPaid: dto.type === 'EXPENSE' ? computeIsPaid(dto.paymentMethod) : true,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
