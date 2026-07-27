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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Transação não encontrada');

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
