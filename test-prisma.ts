import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function test() {
  console.log("Tentando conectar ao Prisma...");
  try {
    const usuarios = await prisma.usuario.findMany();
    console.log("Conexão bem sucedida! Usuários encontrados:", usuarios.length);
    console.log("Primeiro usuário:", usuarios[0]?.email);
  } catch (err) {
    console.error("Erro na conexão Prisma:", err);
  }
}

test();
