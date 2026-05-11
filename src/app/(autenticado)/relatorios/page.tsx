import { obterSessao } from "@/lib/auth-nativo";
import {
  obterDadosConsumoPorVeiculo,
  obterResumoConsumo,
} from "@/lib/relatorios-crud";
import { listarVeiculos } from "@/lib/veiculos-crud";
import { GraficoConsumo } from "@/components/relatorios/grafico-consumo";
import { TabelaResumo } from "@/components/relatorios/tabela-resumo";
import { FiltrosRelatorio } from "./filtros-relatorio";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PaginaRelatorios({ searchParams }: Props) {
  await obterSessao();

  const params = await searchParams;
  const vei_id = params.vei_id ? Number(params.vei_id) : undefined;
  const dataInicio = typeof params.dataInicio === "string" ? params.dataInicio : undefined;
  const dataFim = typeof params.dataFim === "string" ? params.dataFim : undefined;

  const filtros = {
    vei_id: vei_id && !isNaN(vei_id) ? vei_id : undefined,
    dataInicio,
    dataFim,
  };

  const [dadosConsumo, resumo, veiculos] = await Promise.all([
    obterDadosConsumoPorVeiculo(filtros),
    obterResumoConsumo(filtros),
    listarVeiculos(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="mt-1 text-muted-foreground">
          Consumo real × consumo de referência por veículo
        </p>
      </div>

      <FiltrosRelatorio
        veiculos={veiculos}
        veiIdSelecionado={filtros.vei_id}
        dataInicio={filtros.dataInicio}
        dataFim={filtros.dataFim}
      />

      <TabelaResumo resumo={resumo} />

      <GraficoConsumo dados={dadosConsumo} />
    </div>
  );
}
