import type { Usuario } from "@/generated/prisma";

export type { Usuario, Role, Sessao } from "@/generated/prisma";

export type UsuarioSeguro = Omit<Usuario, "senhaHash">;

export type SessaoUsuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  permissoes: string[];
};
