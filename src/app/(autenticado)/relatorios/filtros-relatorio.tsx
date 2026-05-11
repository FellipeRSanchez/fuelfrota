"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import type { VeiculoCompleto } from "@/lib/veiculos-crud";

type Props = {
  veiculos: VeiculoCompleto[];
  veiIdSelecionado?: number;
  dataInicio?: string;
  dataFim?: string;
};

export function FiltrosRelatorio({
  veiculos,
  veiIdSelecionado,
  dataInicio,
  dataFim,
}: Props) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const veiId = form.get("vei_id") as string;
    const inicio = form.get("dataInicio") as string;
    const fim = form.get("dataFim") as string;

    if (veiId) params.set("vei_id", veiId);
    if (inicio) params.set("dataInicio", inicio);
    if (fim) params.set("dataFim", fim);

    router.push(`/relatorios?${params.toString()}`);
  }

  function handleLimpar() {
    router.push("/relatorios");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vei_id" className="text-sm font-medium">
              Veículo
            </label>
            <Select
              id="vei_id"
              name="vei_id"
              defaultValue={veiIdSelecionado ?? ""}
              className="w-48"
            >
              <option value="">Todos os veículos</option>
              {veiculos.map((v) => (
                <option key={v.vei_id} value={v.vei_id}>
                  {v.vei_frota} — {v.vei_placa}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dataInicio" className="text-sm font-medium">
              Data Início
            </label>
            <Input
              id="dataInicio"
              name="dataInicio"
              type="date"
              defaultValue={dataInicio ?? ""}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dataFim" className="text-sm font-medium">
              Data Fim
            </label>
            <Input
              id="dataFim"
              name="dataFim"
              type="date"
              defaultValue={dataFim ?? ""}
              className="w-40"
            />
          </div>

          <Button type="submit" size="sm">
            Filtrar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLimpar}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
