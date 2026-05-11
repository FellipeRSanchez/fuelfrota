import { prisma } from "@/lib/prisma";
import { assinarToken, verificarToken, type PayloadJWT } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NOME = "fuelfrota-token";
const SALT_ROUNDS = 12;

// ==================== HASH DE SENHA ====================

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function compararSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// ==================== GERENCIAMENTO DE SESSÃO ====================

export async function criarSessao(usuarioId: string): Promise<string> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { role: true },
  });

  if (!usuario || !usuario.ativo) {
    throw new Error("Usuário não encontrado ou inativo");
  }

  const payload: PayloadJWT = {
    sub: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    role: usuario.role.nome,
    permissoes: usuario.role.permissoes.split(",").map(p => p.trim()),
  };

  const token = await assinarToken(payload);

  // Persiste sessão no banco (Neon nativo)
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
  await prisma.sessao.create({
    data: {
      token,
      usuarioId: usuario.id,
      expiraEm,
    },
  });

  return token;
}

export async function definirCookieSessao(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NOME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });
}

export async function removerCookieSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NOME);
}

// ==================== VALIDAÇÃO DE SESSÃO (Server Components) ====================

export async function obterSessao(): Promise<PayloadJWT | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NOME)?.value;

  if (!token) return null;

  const payload = await verificarToken(token);
  if (!payload) return null;

  // Verifica se a sessão ainda existe no banco
  const sessao = await prisma.sessao.findUnique({
    where: { token },
  });

  if (!sessao || sessao.expiraEm < new Date()) {
    return null;
  }

  return payload;
}

export async function requererSessao(): Promise<PayloadJWT> {
  const sessao = await obterSessao();
  if (!sessao) {
    throw new Error("Não autenticado");
  }
  return sessao;
}

// ==================== VERIFICAÇÃO DE PERMISSÕES ====================

export function temPermissao(
  sessao: PayloadJWT,
  permissao: string,
): boolean {
  return sessao.permissoes.includes(permissao);
}

export function requererPermissao(
  sessao: PayloadJWT,
  permissao: string,
): void {
  if (!temPermissao(sessao, permissao)) {
    throw new Error(`Permissão negada: ${permissao}`);
  }
}

// ==================== INVALIDAÇÃO DE SESSÃO ====================

export async function invalidarSessao(token: string): Promise<void> {
  await prisma.sessao.deleteMany({
    where: { token },
  });
}

export async function invalidarTodasSessoes(
  usuarioId: string,
): Promise<void> {
  await prisma.sessao.deleteMany({
    where: { usuarioId },
  });
}
