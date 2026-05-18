import prisma from './src/utils/lib/prisma';

async function main() {
  const u = await prisma.usuario.findFirst({ where: { email: 'cliente1@g.com' } });
  console.log('Usuario:', u);
  const c = await prisma.cliente.findFirst({ where: { email: 'cliente1@g.com' } });
  console.log('Cliente:', c);
}

main().catch(console.error);
