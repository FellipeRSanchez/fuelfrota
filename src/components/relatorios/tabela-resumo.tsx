"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumoConsumo } from "@/lib/relatorios-crud";

type Props = {
  resumo: ResumoConsumo[];
};

export function TabelaResumo({ resumo }: Props) {
  if (resumo.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum resumo disponível para o período selecionado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo por Veículo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Frota</th>
                <th className="py-3 pr-4 font-medium">Placa</th>
                <th className="py-3 pr-4 font-medium text-right">
                  Cons. Referência
                </th>
                <th className="py-3 pr-4 font-medium text-right">
                  Cons. Real Médio
                </th>
                <th className="py-3 pr-4 font-medium text-right">
                  Abastecimentos
                </th>
                <th className="py-3 pr-4 font-medium text-right">
                  Total Litros
                </th>
                <th className="py-3 font-medium text-right">Total KM</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((r) => {
                const desvio =
                  r.consumoRealMedio !== null && r.consumoReferencia > 0
                    ? ((r.consumoRealMedio - r.consumoReferencia) /
                        r.consumoReferencia) *
                      100
                    : null;

                return (
                  <tr key={r.vei_id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{r.vei_frota}</td>
                    <td className="py-3 pr-4">{r.vei_placa}</td>
                    <td className="py-3 pr-4 text-right">
                      {r.consumoReferencia.toFixed(1)} km/L
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {r.consumoRealMedio !== null ? (
                        <span
                          className={
                            desvio !== null && Math.abs(desvio) > 15
                              ? "text-destructive"
                              : "text-green-600 dark:text-green-400"
                          }
                        >
                          {r.consumoRealMedio.toFixed(1)} km/L
                          {desvio !== null && (
                            <span className="ml-1 text-xs">
                              ({desvio > 0 ? "+" : ""}
                              {desvio.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {r.totalAbastecimentos}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {r.totalLitros.toFixed(1)} L
                    </td>
                    <td className="py-3 text-right">
                      {r.totalKmRodados !== null
                        ? `${r.totalKmRodados.toFixed(0)} km`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
