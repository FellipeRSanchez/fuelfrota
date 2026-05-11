import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL não configurada no .env");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log("🌱 Inserindo roles e usuário admin via Neon HTTP...");

  // Roles
  await sql`
    INSERT INTO roles (id, nome, permissoes)
    VALUES (1, 'usuario', '["abastecimentos:ler", "abastecimentos:criar"]')
    ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    permissoes = EXCLUDED.permissoes
  `;

  await sql`
    INSERT INTO roles (id, nome, permissoes)
    VALUES (2, 'admin', '["abastecimentos:ler", "abastecimentos:criar", "abastecimentos:editar", "abastecimentos:excluir", "usuarios:ler", "usuarios:criar", "usuarios:editar", "usuarios:excluir", "veiculos:ler", "veiculos:criar", "veiculos:editar", "veiculos:excluir", "motoristas:ler", "motoristas:criar", "motoristas:editar", "motoristas:excluir"]')
    ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    permissoes = EXCLUDED.permissoes
  `;

  // Usuário Admin
  const senhaHash = await bcrypt.hash("admin123", 12);
  await sql`
    INSERT INTO usuarios (id, nome, email, "senhaHash", ativo, "roleId", "criadoEm", "atualizadoEm")
    VALUES ('admin-id', 'Administrador', 'admin@fuelfrota.com.br', ${senhaHash}, true, 2, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    "senhaHash" = EXCLUDED."senhaHash",
    "roleId" = EXCLUDED."roleId"
  `;

  console.log("✅ Seed finalizado com sucesso!");
  console.log("Admin: admin@fuelfrota.com.br / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal no seed:", e);
    process.exit(1);
  });