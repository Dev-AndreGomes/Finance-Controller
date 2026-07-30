import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateTransactionSchema } from '@/lib/validation';
import { badRequest, notFound, serverError, unauthorized } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Transação não encontrada');

    const body = await request.json();
    const dto = updateTransactionSchema.parse(body);

    if (dto.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category || category.userId !== user.id) {
        return badRequest(new Error('Categoria inválida'));
      }
    }

    const nextType = dto.type ?? existing.type;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        description: dto.description ?? undefined,
        amount: dto.amount ?? undefined,
        type: dto.type ?? undefined,
        subtype: nextType === 'EXPENSE' ? (dto.subtype ?? existing.subtype ?? 'VARIABLE') : null,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId === undefined ? undefined : dto.categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Transação não encontrada');

    const scope = new URL(request.url).searchParams.get('scope') === 'all' ? 'all' : 'only';

    // "excluir de todos os meses" numa despesa fixa recorrente: apaga a
    // despesa já lançada em qualquer mês (passado e futuro) e o próprio
    // modelo, pra parar de gerar novas.
    if (scope === 'all' && existing.templateId) {
      await prisma.transaction.deleteMany({ where: { templateId: existing.templateId } });
      await prisma.fixedExpenseTemplate.delete({ where: { id: existing.templateId } }).catch(() => {
        // já pode ter sido apagado em outra aba/requisição, tudo bem
      });
      return NextResponse.json({ success: true });
    }

    // "excluir todas as parcelas" de uma compra parcelada
    if (scope === 'all' && existing.installmentGroupId) {
      await prisma.transaction.deleteMany({ where: { installmentGroupId: existing.installmentGroupId } });
      return NextResponse.json({ success: true });
    }

    // exclusão simples: só essa linha
    await prisma.transaction.delete({ where: { id } });

    // se era uma despesa fixa e o usuário só quis excluir esse mês, marca o
    // skip pra não voltar a aparecer sozinha quando o mês for aberto de novo
    if (existing.templateId) {
      const d = new Date(existing.date);
      await prisma.fixedExpenseSkip
        .create({
          data: {
            templateId: existing.templateId,
            month: d.getUTCMonth() + 1,
            year: d.getUTCFullYear(),
          },
        })
        .catch(() => {
          // se já existir um skip pra esse mês (improvável), ignora
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
