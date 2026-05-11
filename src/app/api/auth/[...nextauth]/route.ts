import { NextResponse } from "next/server";

// Rota NextAuth desabilitada — autenticação nativa Neon em uso
// Use: POST /api/auth/registro, POST /api/auth/entrar, GET/POST/DELETE /api/auth/sessao
export async function GET() {
  return NextResponse.json(
    {
      mensagem:
        "NextAuth desabilitado. Use autenticação nativa: /api/auth/registro, /api/auth/entrar, /api/auth/sessao",
    },
    { status: 410 },
  );
}

export { GET as POST };
