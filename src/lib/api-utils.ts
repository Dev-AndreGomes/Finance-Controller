import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function unauthorized() {
  return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
}

export function notFound(message = 'Não encontrado') {
  return NextResponse.json({ message }, { status: 404 });
}

export function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: error.issues[0]?.message ?? 'Dados inválidos', issues: error.issues },
      { status: 400 },
    );
  }
  return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
}
