import { CardVeiculo } from "@/components/painel/card-veiculo";
import type { VeiculoResumo } from "@/lib/veiculos";
import { Car } from "lucide-react";

export function GridVeiculos({
  veiculos,
}: {
  veiculos: VeiculoResumo[];
}) {
  if (veiculos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Car className="h-12 w-12" />
        <p className="text-lg font-medium">Nenhum veículo ativo</p>
        <p className="text-sm">
          Cadastre veículos para visualizá-los no painel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {veiculos.map((v) => (
        <CardVeiculo key={v.id} veiculo={v} />
      ))}
    </div>
  );
}
