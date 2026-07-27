import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateCategorySchema } from '@/lib/validation';
import { badRequest, notFound, serverError, unauthorized } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Categoria não encontrada');

    const body = await request.json();
    const dto = updateCategorySchema.parse(body);

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        kind: dto.kind ?? undefined,
        color: dto.color ?? undefined,
      },
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
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Categoria não encontrada');

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
