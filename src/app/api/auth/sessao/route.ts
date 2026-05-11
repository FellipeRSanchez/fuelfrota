import { NextResponse } from "next/server";
import {
  obterSessao,
  criarSessao,
  definirCookieSessao,
  removerCookieSessao,
  invalidarSessao,
} from "@/lib/auth-nativo";
import { cookies } from "next/headers";

// GET: Retorna a sessão atual
export async function GET() {
  try {
    const sessao = await obterSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Não autenticado" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: sessao.sub,
      nome: sessao.nome,
      email: sessao.email,
      role: sessao.role,
      permissoes: sessao.permissoes,
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST: Atualiza/renova a sessão
export async function POST() {
  try {
    const sessao = await obterSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Não autenticado" },
        { status: 401 },
      );
    }

    // Invalida sessão antiga e cria nova
    const cookieStore = await cookies();
    const tokenAntigo = cookieStore.get("fuelfrota-token")?.value;
    if (tokenAntigo) {
      await invalidarSessao(tokenAntigo);
    }

    const novoTokens = await criarSessao(sessao.sub);
    await definirCookieSessao(novoTokens);

    return NextResponse.json({
      id: sessao.sub,
      nome: sessao.nome,
      email: sessao.email,
      role: sessao.role,
      permissoes: sessao.permissoes,
      token: novoTokens,
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE: Encerra a sessão (logout)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fuelfrota-token")?.value;

    if (token) {
      await invalidarSessao(token);
    }

    await removerCookieSessao();

    return NextResponse.json({ mensagem: "Sessão encerrada" });
  } catch {
    return NextResponse.json(
      { erro: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
