"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Fuel,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { listarAbastecimentos } from "@/lib/abastecimentos-crud";
import type {
  AbastecimentoListagemItem,
  ResultadoListagemAbastecimento,
} from "@/lib/abastecimentos-crud";
import type { VeiculoCompleto } from "@/lib/veiculos-crud";
import type { MotoristaCompleto } from "@/lib/motoristas-crud";

// ==================== FORMATADORES ====================

function formatarDataHora(data: Date | null): string {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarNumero(valor: number | null): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function formatarKm(valor: number | null): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ==================== PROPS ====================

interface TabelaAbastecimentosProps {
  dadosIniciais: ResultadoListagemAbastecimento;
  veiculos: VeiculoCompleto[];
  motoristas: MotoristaCompleto[];
}

// ==================== COMPONENTE ====================

export function TabelaAbastecimentos({
  dadosIniciais,
  veiculos,
  motoristas,
}: TabelaAbastecimentosProps) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dados, setDados] = useState<ResultadoListagemAbastecimento>(dadosIniciais);
  const [carregando, setCarregando] = useState(false);

  // filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [pagina, setPagina] = useState(dadosIniciais.page);

  const buscar = useCallback(
    async (p: number) => {
      setCarregando(true);
      try {
        const resultado = await listarAbastecimentos({
          vei_id: filtroVeiculo ? Number(filtroVeiculo) : undefined,
          mot_id: filtroMotorista ? Number(filtroMotorista) : undefined,
          dataInicio: filtroDataInicio || undefined,
          dataFim: filtroDataFim || undefined,
          page: p,
          limit: 10,
        });
        setDados(resultado);
        setPagina(resultado.page);
      } catch {
        // erro silencioso — manter dados anteriores
      } finally {
        setCarregando(false);
      }
    },
    [filtroVeiculo, filtroMotorista, filtroDataInicio, filtroDataFim],
  );

  // busca com debounce ao mudar filtros
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      buscar(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filtroVeiculo, filtroMotorista, filtroDataInicio, filtroDataFim, buscar]);

  function handlePaginaAnterior() {
    if (pagina > 1) buscar(pagina - 1);
  }

  function handleProximaPagina() {
    if (pagina < dados.totalPages) buscar(pagina + 1);
  }

  function handleLimparFiltros() {
    setFiltroVeiculo("");
    setFiltroMotorista("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
  }

  const temFiltros =
    filtroVeiculo !== "" ||
    filtroMotorista !== "" ||
    filtroDataInicio !== "" ||
    filtroDataFim !== "";

  // ==================== RENDER: VAZIO ====================

  if (dadosIniciais.total === 0 && !temFiltros) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Fuel className="h-12 w-12" />
        <p className="text-lg font-medium">Nenhum abastecimento registrado</p>
        <p className="text-sm">
          Clique em &ldquo;Novo abastecimento&rdquo; para começar.
        </p>
        <Button onClick={() => router.push("/abastecimento/novo")}>
          Novo abastecimento
        </Button>
      </div>
    );
  }

  // ==================== RENDER: TABELA ====================

  return (
    <div className="space-y-4">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {dados.total} abastecimento
          {dados.total !== 1 ? "s" : ""}
        </h2>
        <Button onClick={() => router.push("/abastecimento/novo")}>
          Novo abastecimento
        </Button>
      </div>

      {/* filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">
            Veículo
          </label>
          <Select
            value={filtroVeiculo}
            onChange={(e) => setFiltroVeiculo(e.target.value)}
          >
            <option value="">Todos os veículos</option>
            {veiculos.map((v) => (
              <option key={v.vei_id} value={v.vei_id}>
                {v.vei_frota} — {v.vei_placa}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">
            Motorista
          </label>
          <Select
            value={filtroMotorista}
            onChange={(e) => setFiltroMotorista(e.target.value)}
          >
            <option value="">Todos os motoristas</option>
            {motoristas.map((m) => (
              <option key={m.mot_id} value={m.mot_id}>
                {m.mot_nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Data início
          </label>
          <Input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Data fim
          </label>
          <Input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="w-[160px]"
          />
        </div>

        {temFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLimparFiltros}
            className="h-10"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">KM rodados</TableHead>
              <TableHead className="text-right">Consumo real</TableHead>
              <TableHead>Alertas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum abastecimento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              dados.items.map((item) => (
                <LinhaAbastecimento key={item.aba_id} item={item} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* paginação */}
      {dados.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {(pagina - 1) * 10 + 1}–{Math.min(pagina * 10, dados.total)}{" "}
            de {dados.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaginaAnterior}
              disabled={pagina <= 1 || carregando}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="px-3 tabular-nums">
              {pagina} / {dados.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleProximaPagina}
              disabled={pagina >= dados.totalPages || carregando}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* indicador de carregamento */}
      {carregando && (
        <div className="text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      )}
    </div>
  );
}

// ==================== LINHA ====================

function LinhaAbastecimento({ item }: { item: AbastecimentoListagemItem }) {
  const router = useRouter();
  const alertas: string[] = [];

  if (item.aba_dentro_da_media === false) {
    alertas.push("Fora da média");
  }
  if (item.aba_hodometro_ausente) {
    alertas.push("Sem hodômetro");
  }
  if (item.aba_km_rodados_calculado === null && !item.aba_hodometro_ausente) {
    alertas.push("KM pendente");
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/abastecimento/${item.aba_id}`)}
    >
      <TableCell className="whitespace-nowrap">
        {formatarDataHora(item.aba_data_hora)}
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium">{item.veiculo.vei_frota}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {item.veiculo.vei_placa}
          </span>
        </div>
      </TableCell>
      <TableCell>{item.motorista.mot_nome}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatarNumero(item.aba_litros_aprovados)} L
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatarKm(item.aba_km_rodados_calculado)}
        {item.aba_km_rodados_calculado !== null ? " km" : ""}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {item.aba_consumo_real_calculado !== null
          ? `${formatarNumero(item.aba_consumo_real_calculado)} km/L`
          : "—"}
      </TableCell>
      <TableCell>
        {alertas.length === 0 ? (
          <Badge
            variant="outline"
            className="gap-1 border-green-200 text-green-700"
          >
            <CheckCircle2 className="h-3 w-3" />
            OK
          </Badge>
        ) : (
          <div className="flex flex-wrap gap-1">
            {alertas.map((alerta) => (
              <Badge
                key={alerta}
                variant="destructive"
                className="gap-1 whitespace-nowrap"
              >
                <AlertTriangle className="h-3 w-3" />
                {alerta}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
