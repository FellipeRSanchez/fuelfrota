import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha, criarSessao, definirCookieSessao } from "@/lib/auth-nativo";
import { schemaRegistro } from "@/lib/validacoes";

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const dados = schemaRegistro.parse(corpo);

    // Verifica se email já existe
    const existente = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (existente) {
      return NextResponse.json(
        { erro: "Email já cadastrado" },
        { status: 409 },
      );
    }

    const senhaHash = await hashSenha(dados.senha);

    const usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash,
        roleId: 1, // role padrão: "usuario"
      },
      include: { role: true },
    });

    const token = await criarSessao(usuario.id);
    await definirCookieSessao(token);

    return NextResponse.json(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role.nome,
        permissoes: usuario.role.permissoes,
      },
      { status: 201 },
    );
  } catch (erro: unknown) {
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
