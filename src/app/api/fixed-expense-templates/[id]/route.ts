import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateFixedTemplateSchema } from '@/lib/validation';
import { badRequest, notFound, serverError, unauthorized } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.fixedExpenseTemplate.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Despesa fixa não encontrada');

    const body = await request.json();
    const dto = updateFixedTemplateSchema.parse(body);

    const updated = await prisma.fixedExpenseTemplate.update({
      where: { id },
      data: {
        description: dto.description ?? undefined,
        amount: dto.amount ?? undefined,
        dayOfMonth: dto.dayOfMonth ?? undefined,
        endMonth: dto.endMonth === undefined ? undefined : dto.endMonth,
        endYear: dto.endYear === undefined ? undefined : dto.endYear,
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
    const existing = await prisma.fixedExpenseTemplate.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound('Despesa fixa não encontrada');

    // Deleting the template only stops future recurrence — already
    // materialized Transaction rows are independent and remain untouched
    // (their `templateId` gets nulled out by the schema's onDelete: SetNull).
    await prisma.fixedExpenseTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
