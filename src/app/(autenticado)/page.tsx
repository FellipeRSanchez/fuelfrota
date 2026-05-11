import { obterSessao } from "@/lib/auth-nativo";
import { obterVeiculosAtivos } from "@/lib/veiculos";
import { GridVeiculos } from "@/components/painel/grid-veiculos";

export default async function PaginaPainel() {
  const sessao = await obterSessao();
  const veiculos = await obterVeiculosAtivos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {sessao?.nome ?? "Usuário"}! Veja o resumo da sua frota.
        </p>
      </div>

      <GridVeiculos veiculos={veiculos} />
    </div>
  );
}
