import { NextResponse } from 'next/server';
import prisma from '@/utils/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await prisma.usuario.findFirst({ where: { email: 'cliente1@g.com' } });
  const c = await prisma.cliente.findFirst({ where: { email: 'cliente1@g.com' } });
  return NextResponse.json({ usuario: u, cliente: c });
}
