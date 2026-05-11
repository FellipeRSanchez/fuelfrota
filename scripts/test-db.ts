/**
 * Script temporário para validar a conexão com o banco Neon.
 * Executar com: npx tsx scripts/test-db.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

async function testarConexao() {
  console.log("🔌 Testando conexão com Neon...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada no .env");
    process.exit(1);
  }

  console.log(`   URL: ${process.env.DATABASE_URL.slice(0, 60)}...`);

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Teste 1: ping
    const resultado = await prisma.$queryRawUnsafe<[{ resultado: number }]>(
      "SELECT 1 AS resultado"
    );
    console.log(`✅ Ping: ${resultado[0].resultado === 1 ? "OK" : "FALHOU"}`);

    // Teste 2: contar registros
    const [veiculos, motoristas, abastecimentos] = await Promise.all([
      prisma.veiculos.count(),
      prisma.motoristas.count(),
      prisma.abastecimentos.count(),
    ]);

    console.log(`\n📊 Registros no banco:`);
    console.log(`   veiculos:       ${veiculos}`);
    console.log(`   motoristas:     ${motoristas}`);
    console.log(`   abastecimentos: ${abastecimentos}`);

    // Teste 3: verificar novas colunas (cast para text por causa do adapter Neon)
    const colunasVeiculos = await prisma.$queryRawUnsafe<
      { column_name: string }[]
    >(
      `SELECT column_name::text FROM information_schema.columns WHERE table_name = 'veiculos' ORDER BY ordinal_position`
    );
    console.log(`\n📋 Colunas de veiculos: ${colunasVeiculos.map((c: any) => c.column_name).join(", ")}`);

    const colunasMotoristas = await prisma.$queryRawUnsafe<
      { column_name: string }[]
    >(
      `SELECT column_name::text FROM information_schema.columns WHERE table_name = 'motoristas' ORDER BY ordinal_position`
    );
    console.log(`📋 Colunas de motoristas: ${colunasMotoristas.map((c: any) => c.column_name).join(", ")}`);

    console.log("\n🎉 Conexão validada com sucesso!");
  } catch (erro) {
    console.error("❌ Erro na conexão:", erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();
