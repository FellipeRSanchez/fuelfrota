import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    const veiculos = await prisma.veiculos.findMany();
    console.log('Veiculos:', JSON.stringify(veiculos, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
