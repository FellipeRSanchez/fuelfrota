import { obterSessao } from "@/lib/auth-nativo";

export default async function PaginaPainel() {
  const sessao = await obterSessao();

  return (
    <div>
      <h1 className="text-2xl font-bold">Painel</h1>
      <p className="mt-2 text-muted-foreground">
        Bem-vindo, {sessao?.nome ?? "Usuário"}!
      </p>
    </div>
  );
}
