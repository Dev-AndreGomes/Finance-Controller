import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createCategorySchema } from '@/lib/validation';
import { badRequest, serverError, unauthorized } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const dto = createCategorySchema.parse(body);

    const existing = await prisma.category.findUnique({
      where: { userId_name: { userId: user.id, name: dto.name } },
    });
    if (existing) {
      return NextResponse.json({ message: 'Já existe uma categoria com este nome' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: dto.name,
        kind: dto.kind,
        color: dto.color,
        userId: user.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
