"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DadosConsumoVeiculo } from "@/lib/relatorios-crud";

type Props = {
  dados: DadosConsumoVeiculo[];
};

export function GraficoConsumo({ dados }: Props) {
  if (dados.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum dado de abastecimento encontrado para o período selecionado.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {dados.map((veiculo) => {
        // Prepara dados para o gráfico de linhas (consumo real vs referência)
        const dadosLinha = veiculo.abastecimentos
          .filter((a) => a.consumoReal !== null)
          .map((a) => ({
            data: a.data.slice(5), // MM-DD
            "Consumo Real": Number(a.consumoReal?.toFixed(2)),
            "Consumo Referência": Number(a.consumoReferencia.toFixed(2)),
          }));

        // Prepara dados para o gráfico de barras (KM rodados por abastecimento)
        const dadosBarras = veiculo.abastecimentos
          .filter((a) => a.kmRodados !== null)
          .map((a) => ({
            data: a.data.slice(5),
            "KM Rodados": Number(a.kmRodados?.toFixed(0)),
          }));

        const temDadosConsumo = dadosLinha.length > 0;
        const temDadosKm = dadosBarras.length > 0;

        if (!temDadosConsumo && !temDadosKm) {
          return (
            <Card key={veiculo.vei_id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {veiculo.vei_frota} — {veiculo.vei_placa}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                Dados insuficientes para gerar gráficos deste veículo.
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={veiculo.vei_id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {veiculo.vei_frota} — {veiculo.vei_placa}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {temDadosConsumo && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Consumo Real × Consumo Referência (km/L)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosLinha}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="data"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        label={{
                          value: "km/L",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 12 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Consumo Real"
                        stroke="hsl(142, 71%, 45%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Consumo Referência"
                        stroke="hsl(220, 70%, 50%)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {temDadosKm && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    KM Rodados por Abastecimento
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosBarras}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="data"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        label={{
                          value: "KM",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 12 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="KM Rodados"
                        fill="hsl(220, 70%, 50%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
