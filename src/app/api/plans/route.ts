import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { upsertPlanSchema } from '@/lib/validation';
import { badRequest, serverError, unauthorized } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);

    const plan = await prisma.monthlyPlan.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } },
    });

    return NextResponse.json({
      month,
      year,
      investPercentage: plan?.investPercentage.toNumber() ?? 0,
      confirmed: plan?.confirmed ?? false,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const dto = upsertPlanSchema.parse(body);

    const plan = await prisma.monthlyPlan.upsert({
      where: { userId_month_year: { userId: user.id, month: dto.month, year: dto.year } },
      create: {
        userId: user.id,
        month: dto.month,
        year: dto.year,
        investPercentage: dto.investPercentage,
        confirmed: dto.confirmed ?? false,
      },
      update: {
        investPercentage: dto.investPercentage,
        confirmed: dto.confirmed ?? false,
      },
    });

    return NextResponse.json({
      month: plan.month,
      year: plan.year,
      investPercentage: plan.investPercentage.toNumber(),
      confirmed: plan.confirmed,
    });
  } catch (error) {
    return badRequest(error);
  }
}
