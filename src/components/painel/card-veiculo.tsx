import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Gauge, Calendar, Fuel } from "lucide-react";
import type { VeiculoResumo } from "@/lib/veiculos";

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarKm(km: number | null): string {
  if (km === null) return "—";
  return km.toLocaleString("pt-BR");
}

function formatarSaldo(litros: number): string {
  return litros.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function CardVeiculo({ veiculo }: { veiculo: VeiculoResumo }) {
  const temAlertas = veiculo.hodometroAusente || veiculo.foraDaMedia;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              {veiculo.frota}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{veiculo.placa}</p>
          </div>
          {temAlertas && (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Saldo atual */}
        <div className="flex items-center gap-2 text-sm">
          <Fuel className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Saldo:</span>
          <span className="font-semibold">
            {formatarSaldo(veiculo.saldoAtual)} L
          </span>
        </div>

        {/* Último KM */}
        <div className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Último KM:</span>
          <span className="font-semibold">
            {formatarKm(veiculo.ultimoKm)}
          </span>
        </div>

        {/* Data último abastecimento */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Último abast.:</span>
          <span>{formatarData(veiculo.dataUltimoAbastecimento)}</span>
        </div>

        {/* Badges de alerta */}
        {(veiculo.hodometroAusente || veiculo.foraDaMedia) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {veiculo.hodometroAusente && (
              <Badge variant="destructive">Sem hodômetro</Badge>
            )}
            {veiculo.foraDaMedia && (
              <Badge variant="secondary">Fora da média</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
