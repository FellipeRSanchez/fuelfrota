// Re-exporta autenticação nativa para manter compatibilidade
// com imports existentes que usavam @/lib/auth
export {
  hashSenha,
  compararSenha,
  criarSessao,
  definirCookieSessao,
  removerCookieSessao,
  obterSessao,
  requererSessao,
  temPermissao,
  requererPermissao,
  invalidarSessao,
  invalidarTodasSessoes,
} from "@/lib/auth-nativo";

export type { PayloadJWT } from "@/lib/jwt";
