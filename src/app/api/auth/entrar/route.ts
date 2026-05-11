import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, criarSessao, definirCookieSessao } from "@/lib/auth-nativo";
import { schemaEntrar } from "@/lib/validacoes";

export async function POST(request: Request) {
  try {
    console.log('[Auth Entrar] Recebendo request');
    const corpo = await request.json();
    console.log('[Auth Entrar] Corpo recebido:', JSON.stringify(corpo));
    const dados = schemaEntrar.parse(corpo);

    console.log('[Auth Entrar] Consultando usuário no DB');
    console.log('[Auth Entrar] DATABASE_URL:', process.env.DATABASE_URL);
    let usuario;
    try {
      usuario = await prisma.usuario.findUnique({
        where: { email: dados.email },
        include: { role: true },
      });
    } catch (dbErr) {
      console.error('[Auth Entrar] Erro ao consultar DB:', dbErr);
      throw dbErr; // rethrow to be caught by outer catch
    }
    console.log('[Auth Entrar] Usuário encontrado:', usuario?.id);

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { erro: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    console.log('[Auth Entrar] Comparando senha');
    const senhaValida = await compararSenha(dados.senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { erro: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    console.log('[Auth Entrar] Criando sessão');
    const token = await criarSessao(usuario.id);
    console.log('[Auth Entrar] Definindo cookie de sessão');
    await definirCookieSessao(token);

    return NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.nome,
      permissoes: usuario.role.permissoes,
      token,
    });
  } catch (erro: unknown) {
    // Log detalhado para depuração
    console.error("[Auth Entrar] Erro inesperado:", erro);

    if (erro instanceof Error && erro.name === "ZodError") {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: (erro as unknown as { errors: unknown }).errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { erro: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
