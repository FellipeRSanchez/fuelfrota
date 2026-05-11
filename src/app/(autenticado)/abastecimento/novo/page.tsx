import { obterSessao } from "@/lib/auth-nativo";
import { redirect } from "next/navigation";
import { FormAbastecimento } from "@/components/abastecimentos/form-abastecimento";

export default async function PaginaNovoAbastecimento() {
  const sessao = await obterSessao();

  if (!sessao) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Novo Abastecimento
        </h1>
        <p className="text-muted-foreground">
          Registre um novo abastecimento para um veículo da frota.
        </p>
      </div>

      <FormAbastecimento />
    </div>
  );
}
