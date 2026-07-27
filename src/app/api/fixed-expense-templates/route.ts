import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createFixedTemplateSchema } from '@/lib/validation';
import { badRequest, serverError, unauthorized } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const templates = await prisma.fixedExpenseTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const dto = createFixedTemplateSchema.parse(body);

    const template = await prisma.fixedExpenseTemplate.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        dayOfMonth: dto.dayOfMonth,
        startMonth: dto.startMonth,
        startYear: dto.startYear,
        endMonth: dto.repeats ? (dto.endMonth ?? null) : dto.startMonth,
        endYear: dto.repeats ? (dto.endYear ?? null) : dto.startYear,
        userId: user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
