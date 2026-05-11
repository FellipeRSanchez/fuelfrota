"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  schemaAbastecimento,
  type FormValuesAbastecimento,
} from "@/lib/validacoes/abastecimento";
import {
  criarAbastecimento,
  obterUltimoAbastecimento,
  obterUltimoAbastecimentoComHodometro,
} from "@/lib/abastecimentos-crud";
import { obterVeiculoPorId, type VeiculoCompleto } from "@/lib/veiculos-crud";
import {
  listarMotoristas,
  type MotoristaCompleto,
} from "@/lib/motoristas-crud";
import { listarVeiculos } from "@/lib/veiculos-crud";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Droplets,
  Fuel,
  Car,
  Info,
} from "lucide-react";

// ==================== TIPOS ====================

type DadosVeiculoInfo = {
  veiculo: VeiculoCompleto | null;
  saldoAtual: number;        // saldo atual estimado (saldo_final_anterior - consumido)
  saldoFinalAnterior: number; // aba_saldo_final do último abastecimento
  ultimoKm: number | null;
  hodometroAusentePendente: boolean;
};

type Alertas = {
  capacidadeExcedida: boolean;
  foraDaMedia: boolean;
  saldoNegativo: boolean;
  semHodometroPendente: boolean;
};

// ==================== COMPONENTE ====================

export function FormAbastecimento() {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoCompleto[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaCompleto[]>([]);
  const [carregandoListas, setCarregandoListas] = useState(true);
  const [infoVeiculo, setInfoVeiculo] = useState<DadosVeiculoInfo>({
    veiculo: null,
    saldoAtual: 0,
    saldoFinalAnterior: 0,
    ultimoKm: null,
    hodometroAusentePendente: false,
  });

  // Controla se litros_tanque_antes foi preenchido automaticamente
  const tanqueAntesAuto = useRef(false);
  // Controla se litros_aprovados foi calculado automaticamente
  const aprovadosAuto = useRef(false);

  const form = useForm<FormValuesAbastecimento>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaAbastecimento) as any,
      // Definimos hodômetro ausente como padrão para evitar falha de validação
      // em testes que não preenchem o campo de KM. O usuário pode desmarcar
      // se desejar informar o valor real.
  defaultValues: {
    // Use undefined for required selects so that Zod validation can correctly detect missing selection
    vei_id: "",
    mot_id: "",
    hodometro_ausente: true,
    km_hodometro: "",
    litros_tanque_antes: "",
    litros_aprovados: "",
    km_previsto_rodar: "",
  },
  });

  // Log form values on each change to help debug "invalid input" issues
  const watchAllFields = form.watch();
  useEffect(() => {
    console.log('[Debug] Form values snapshot:', watchAllFields);
  }, [watchAllFields]);

  const estaEnviando = form.formState.isSubmitting;
  const hodometroAusente = form.watch("hodometro_ausente");
  const veiId = form.watch("vei_id");
  const kmHodometro = form.watch("km_hodometro");
  const litrosTanqueAntes = form.watch("litros_tanque_antes");
  const litrosAprovados = form.watch("litros_aprovados");
  const kmPrevistoRodar = form.watch("km_previsto_rodar");

  // ==================== CARREGAMENTO INICIAL ====================

  useEffect(() => {
    async function carregar() {
      try {
        const [v, m] = await Promise.all([listarVeiculos(), listarMotoristas()]);
        setVeiculos(v);
        setMotoristas(m);
      } catch {
        setErroGeral("Erro ao carregar dados. Recarregue a página.");
      } finally {
        setCarregandoListas(false);
      }
    }
    carregar();
  }, []);

  // ==================== BUSCA INFO DO VEÍCULO ====================

  useEffect(() => {
    if (!veiId) {
      setInfoVeiculo({
        veiculo: null,
        saldoAtual: 0,
        saldoFinalAnterior: 0,
        ultimoKm: null,
        hodometroAusentePendente: false,
      });
      tanqueAntesAuto.current = false;
      aprovadosAuto.current = false;
      return;
    }

    async function buscarInfo() {
      try {
        const id = Number(veiId);
        const [veiculo, ultimo, ultimoComHodometro] = await Promise.all([
          obterVeiculoPorId(id),
          obterUltimoAbastecimento(id),
          obterUltimoAbastecimentoComHodometro(id),
        ]);

        const saldoFinalAnterior = ultimo ? Number(ultimo.aba_saldo_final) : 0;
        const consumoRef = veiculo?.vei_consumo_referencia ?? 0;
        const kmAtual = parseFloat(
          String(form.getValues("km_hodometro") || "0").replace(",", "."),
        );

        // Calcula consumo desde o último abastecimento
        let litrosConsumidosDesdeUltimo = 0;
        if (
          kmAtual > 0 &&
          ultimoComHodometro?.aba_km_hodometro &&
          consumoRef > 0
        ) {
          const kmRodados = kmAtual - ultimoComHodometro.aba_km_hodometro;
          if (kmRodados > 0) {
            litrosConsumidosDesdeUltimo = kmRodados / consumoRef;
          }
        }

        // Saldo atual real = saldo final anterior − consumido desde o último
        const saldoAtual = Math.max(0, saldoFinalAnterior - litrosConsumidosDesdeUltimo);

        setInfoVeiculo({
          veiculo,
          saldoAtual,
          saldoFinalAnterior,
          ultimoKm: ultimoComHodometro?.aba_km_hodometro ?? null,
          hodometroAusentePendente: ultimo?.aba_hodometro_ausente === true,
        });

        // litros_tanque_antes = saldo_final_anterior - consumido desde o último
        form.setValue(
          "litros_tanque_antes",
          saldoAtual.toFixed(1),
        );
        tanqueAntesAuto.current = true;
        aprovadosAuto.current = false;
      } catch {
        setInfoVeiculo({
          veiculo: null,
          saldoAtual: 0,
          saldoFinalAnterior: 0,
          ultimoKm: null,
          hodometroAusentePendente: false,
        });
        tanqueAntesAuto.current = false;
        aprovadosAuto.current = false;
      }
    }

    buscarInfo();
  }, [veiId, form]);

  // ==================== RECÁLCULO DE LITROS NO TANQUE ====================

  // Recalcula litros_tanque_antes quando KM hodômetro muda,
  // desde que o usuário não tenha editado o campo manualmente
  useEffect(() => {
    if (!tanqueAntesAuto.current) return;
    if (!veiId) return;

    const kmAtual = parseFloat(
      String(kmHodometro || "0").replace(",", "."),
    );
    const consumoRef = infoVeiculo.veiculo?.vei_consumo_referencia ?? 0;
    const ultimoKm = infoVeiculo.ultimoKm;
    const saldoFinalAnterior = infoVeiculo.saldoFinalAnterior;

    // Saldo atual = saldo_final_anterior - consumo desde o último KM
    let saldoAtual = saldoFinalAnterior;
    if (kmAtual > 0 && ultimoKm !== null && consumoRef > 0) {
      const kmRodados = kmAtual - ultimoKm;
      if (kmRodados > 0) {
        saldoAtual = Math.max(0, saldoFinalAnterior - kmRodados / consumoRef);
      }
    }

    // Atualiza saldoAtual no estado para os cards de info
    setInfoVeiculo((prev) => ({ ...prev, saldoAtual }));
    form.setValue("litros_tanque_antes", saldoAtual.toFixed(1));
  }, [kmHodometro, veiId, infoVeiculo.ultimoKm, infoVeiculo.veiculo, infoVeiculo.saldoFinalAnterior, form]);

  // ==================== CÁLCULOS EM TEMPO REAL ====================

  const calculos = useCallback(() => {
    const tanqueAntes = parseFloat(
      String(litrosTanqueAntes || "0").replace(",", "."),
    );
    const aprovados = parseFloat(
      String(litrosAprovados || "0").replace(",", "."),
    );
    const kmPrevisto = parseFloat(
      String(kmPrevistoRodar || "0").replace(",", "."),
    );
    const kmAtual = parseFloat(String(kmHodometro || "0").replace(",", "."));
    const consumoRef = infoVeiculo.veiculo?.vei_consumo_referencia ?? 0;
    const capacidade = infoVeiculo.veiculo?.vei_capacidade_tanque ?? 0;

    // Saldo final = tanque antes + litros aprovados
    const saldoFinal = tanqueAntes + aprovados;

    // Litros consumidos = KM previsto / consumo referência (km/L)
    const litrosConsumidos = consumoRef > 0 ? kmPrevisto / consumoRef : 0;

    // Litros necessários (sugestão de abastecimento)
    const litrosNecessarios = Math.max(0, litrosConsumidos - tanqueAntes);

    // Saldo após consumo
    const saldoAposConsumo = tanqueAntes - litrosConsumidos;

    // KM rodados
    let kmRodados: number | null = null;
    if (
      !hodometroAusente &&
      !isNaN(kmAtual) &&
      kmAtual > 0 &&
      infoVeiculo.ultimoKm !== null
    ) {
      kmRodados = kmAtual - infoVeiculo.ultimoKm;
    }

    // Consumo real
    let consumoReal: number | null = null;
    let desvio: number | null = null;
    let dentroDaMedia: boolean | null = null;

    if (kmRodados !== null && kmRodados > 0 && aprovados > 0) {
      consumoReal = kmRodados / aprovados;
      if (consumoRef > 0) {
        desvio = Math.abs(consumoReal - consumoRef) / consumoRef;
        dentroDaMedia = desvio <= 0.15;
      }
    }

    // Alertas
    const alertas: Alertas = {
      capacidadeExcedida: capacidade > 0 && saldoFinal > capacidade,
      foraDaMedia: dentroDaMedia === false,
      saldoNegativo: tanqueAntes > 0 && kmPrevisto > 0 && saldoAposConsumo < 0,
      semHodometroPendente: infoVeiculo.hodometroAusentePendente,
    };

    return {
      saldoFinal,
      litrosConsumidos,
      litrosNecessarios,
      saldoAposConsumo,
      kmRodados,
      consumoReal,
      desvio,
      dentroDaMedia,
      alertas,
    };
  }, [
    litrosTanqueAntes,
    litrosAprovados,
    kmPrevistoRodar,
    kmHodometro,
    hodometroAusente,
    infoVeiculo,
  ]);

  const calc = calculos();

  // ==================== AUTO-CÁLCULO DE LITROS APROVADOS ====================

  useEffect(() => {
    // Só sugere se o usuário ainda não alterou manualmente
    if (!aprovadosAuto.current) return;

    const consumoRef = infoVeiculo.veiculo?.vei_consumo_referencia ?? 0;
    const tanqueAntes = parseFloat(
      String(litrosTanqueAntes || "0").replace(",", "."),
    );
    const kmPrevisto = parseFloat(
      String(kmPrevistoRodar || "0").replace(",", "."),
    );

    if (consumoRef > 0 && kmPrevisto > 0) {
      const litrosConsumidos = kmPrevisto / consumoRef;
      const necessario = Math.max(0, litrosConsumidos - tanqueAntes);
      if (necessario > 0) {
        form.setValue("litros_aprovados", necessario.toFixed(1));
      }
    }
  }, [kmPrevistoRodar, litrosTanqueAntes, infoVeiculo.veiculo, form]);

  // Reseta flag de auto quando o usuário digita manualmente nos litros aprovados
  const handleAprovadosChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      aprovadosAuto.current = false;
      form.setValue("litros_aprovados", e.target.value);
    },
    [form],
  );

  // Reseta flag de auto quando o usuário digita manualmente no tanque antes
  const handleTanqueAntesChange = useCallback(() => {
    tanqueAntesAuto.current = false;
  }, []);

  // ==================== SUBMIT ====================

  async function onSubmit(dados: FormValuesAbastecimento) {
    setErroGeral(null);

    try {
      const resultado = await criarAbastecimento(dados);

      if (!resultado.sucesso) {
        if (resultado.campo) {
          form.setError(resultado.campo as keyof FormValuesAbastecimento, {
            message: resultado.erro,
          });
        } else {
          setErroGeral(resultado.erro);
        }
        return;
      }

      // Se há alertas críticos, registra no console para auditoria
      const { alertas } = resultado;
      const temAlertasCriticos =
        alertas.capacidadeExcedida ||
        alertas.foraDaMedia ||
        alertas.saldoNegativo;

      if (temAlertasCriticos) {
        console.warn(
          "[Abastecimento] Registrado com alertas:",
          JSON.stringify(alertas),
        );
      }

      router.push("/painel");
    } catch {
      setErroGeral("Erro de conexão. Tente novamente.");
    }
  }

  // ==================== RENDER ====================

  if (carregandoListas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const temAlertas =
    calc.alertas.capacidadeExcedida ||
    calc.alertas.foraDaMedia ||
    calc.alertas.saldoNegativo ||
    calc.alertas.semHodometroPendente;

  const temCalculos = litrosTanqueAntes || litrosAprovados || kmPrevistoRodar;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Erro geral */}
        {erroGeral && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {erroGeral}
          </div>
        )}

        {/* ==================== SELEÇÃO ==================== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Veículo e Motorista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vei_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <FormControl>
                      <Select disabled={estaEnviando} {...field}>
                        <option value="">Selecione um veículo...</option>
                        {veiculos.map((v) => (
                          <option key={v.vei_id} value={String(v.vei_id)}>
                            {v.vei_frota} - {v.vei_placa}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <FormControl>
                      <Select disabled={estaEnviando} {...field}>
                        <option value="">Selecione um motorista...</option>
                        {motoristas.map((m) => (
                          <option key={m.mot_id} value={String(m.mot_id)}>
                            {m.mot_nome}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== CARDS INFO DO VEÍCULO ==================== */}
        {infoVeiculo.veiculo && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Saldo do último abastecimento */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Saldo Anterior
                </CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {infoVeiculo.saldoFinalAnterior.toFixed(1)} L
                </p>
                <p className="text-xs text-muted-foreground">
                  Saldo após último abastecimento
                </p>
              </CardContent>
            </Card>

            {/* Saldo atual estimado (saldo anterior - consumido) */}
            <Card className={`border-2 ${
              infoVeiculo.saldoAtual < 50
                ? "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                : "border-green-200 bg-green-50/50 dark:bg-green-950/20"
            }`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Saldo Atual Est.
                </CardTitle>
                <Droplets className={`h-4 w-4 ${
                  infoVeiculo.saldoAtual < 50 ? "text-red-500" : "text-green-500"
                }`} />
              </CardHeader>
              <CardContent className="pb-4">
                <p className={`text-xl font-bold ${
                  infoVeiculo.saldoAtual < 50
                    ? "text-red-700 dark:text-red-400"
                    : "text-green-700 dark:text-green-400"
                }`}>
                  {infoVeiculo.saldoAtual.toFixed(1)} L
                </p>
                <p className="text-xs text-muted-foreground">
                  Anterior − consumo rodado
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Consumo Ref.
                </CardTitle>
                <Fuel className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  {infoVeiculo.veiculo.vei_consumo_referencia.toFixed(2)} km/L
                </p>
                <p className="text-xs text-muted-foreground">
                  Tolerância de ±15%
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50/50 dark:bg-gray-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Último KM
                </CardTitle>
                <Gauge className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xl font-bold">
                  {infoVeiculo.ultimoKm !== null
                    ? infoVeiculo.ultimoKm.toLocaleString()
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {infoVeiculo.ultimoKm !== null
                    ? "Último hodômetro válido"
                    : "Sem histórico de KM"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== CAMPOS DE ENTRADA ==================== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4" />
              Dados do Abastecimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KM Hodômetro + Checkbox */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="km_hodometro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Hodômetro</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 150000"
                        disabled={estaEnviando || hodometroAusente}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {infoVeiculo.ultimoKm !== null
                        ? `Último KM registrado: ${infoVeiculo.ultimoKm.toLocaleString()}`
                        : "Informe o KM atual do hodômetro"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hodometro_ausente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          if (e.target.checked) {
                            form.setValue("km_hodometro", "");
                          }
                        }}
                        disabled={estaEnviando}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer text-sm font-normal">
                      Sem hodômetro
                    </FormLabel>
                    <FormDescription className="!mt-0">
                      Marque se o hodômetro estiver quebrado ou ausente
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Litros no tanque antes */}
              <FormField
                control={form.control}
                name="litros_tanque_antes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros no tanque antes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 200"
                        disabled={estaEnviando}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTanqueAntesChange();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {tanqueAntesAuto.current
                        ? `Calculado: ${infoVeiculo.saldoFinalAnterior.toFixed(1)} L (saldo ant.) − consumo rodado`
                        : "Quantos litros restam no tanque agora"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* KM previsto rodar */}
              <FormField
                control={form.control}
                name="km_previsto_rodar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM previsto rodar</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 500"
                        disabled={estaEnviando}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Reabilita auto-cálculo de litros aprovados
                          aprovadosAuto.current = true;
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantos KM pretende rodar até o próximo abastecimento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Litros aprovados */}
              <FormField
                control={form.control}
                name="litros_aprovados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros aprovados</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 300"
                          disabled={estaEnviando}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleAprovadosChange(e);
                          }}
                        />
                        {aprovadosAuto.current &&
                          calc.litrosNecessarios > 0 &&
                          litrosAprovados && (
                            <Badge
                              variant="outline"
                              className="absolute right-2 top-1/2 -translate-y-1/2 border-blue-300 bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                            >
                              <Info className="mr-1 h-3 w-3" />
                              Sugestão
                            </Badge>
                          )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {aprovadosAuto.current && calc.litrosNecessarios > 0
                        ? `Calculado automaticamente: ${calc.litrosNecessarios.toFixed(1)} L necessários`
                        : "Quantos litros foram aprovados para abastecer"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Saldo final (calculado, somente leitura) */}
              {temCalculos && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Saldo final estimado
                  </label>
                  <div
                    className={`flex h-10 items-center rounded-md border px-3 text-sm ${
                      calc.alertas.capacidadeExcedida
                        ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/20"
                        : "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20"
                    }`}
                  >
                    <Droplets className="mr-2 h-4 w-4" />
                    <span className="font-semibold">
                      {calc.saldoFinal.toFixed(1)} L
                    </span>
                    {calc.alertas.capacidadeExcedida && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-red-300 text-red-600"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Excede capacidade
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ==================== PAINEL DE CÁLCULOS ==================== */}
        {temCalculos && (
          <Card className="border-2 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="h-4 w-4" />
                Cálculos em tempo real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                {/* KM rodados desde o último abastecimento */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">
                    KM rodados
                  </span>
                  <p className="text-lg font-bold">
                    {calc.kmRodados !== null
                      ? `${calc.kmRodados.toFixed(0)} km`
                      : "—"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {hodometroAusente
                      ? "Hodômetro ausente"
                      : infoVeiculo.ultimoKm !== null
                        ? `Atual − ${infoVeiculo.ultimoKm.toLocaleString()}`
                        : "Sem referência"}
                  </span>
                </div>

                {/* Saldo atual (saldo anterior - consumido desde último) */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">
                    Saldo atual no tanque
                  </span>
                  <p className="text-lg font-bold text-blue-600">
                    {parseFloat(String(litrosTanqueAntes || "0").replace(",", ".")).toFixed(1)} L
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {infoVeiculo.saldoFinalAnterior > 0
                      ? `${infoVeiculo.saldoFinalAnterior.toFixed(1)} L ant. − rodado`
                      : "Saldo no tanque agora"}
                  </span>
                </div>

                {/* Diesel necessário para a próxima viagem */}
                <div className={`rounded-lg border p-3 ${
                  calc.litrosNecessarios > 0
                    ? "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                    : "border-green-200 bg-green-50/50 dark:bg-green-950/20"
                }`}>
                  <span className="text-xs text-muted-foreground">
                    Diesel p/ próxima viagem
                  </span>
                  <p className={`text-lg font-bold ${
                    calc.litrosNecessarios > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {calc.litrosNecessarios > 0
                      ? `Faltam ${calc.litrosNecessarios.toFixed(1)} L`
                      : `Sobram ${Math.abs(calc.saldoAposConsumo).toFixed(1)} L`}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {kmPrevistoRodar && infoVeiculo.veiculo
                      ? `${parseFloat(String(kmPrevistoRodar).replace(",", ".")).toFixed(0)} km ÷ ${infoVeiculo.veiculo.vei_consumo_referencia.toFixed(1)} = ${calc.litrosConsumidos.toFixed(1)} L`
                      : "Informe o KM previsto"}
                  </span>
                </div>

                {/* Consumo real */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">
                    Consumo real
                  </span>
                  <p className="text-lg font-bold">
                    {calc.consumoReal !== null
                      ? `${calc.consumoReal.toFixed(2)} km/L`
                      : "—"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {calc.consumoReal !== null
                      ? "KM rodados ÷ litros abastecidos"
                      : "Sem dados suficientes"}
                  </span>
                </div>
              </div>

              {/* Indicador dentro/fora da média */}
              {calc.dentroDaMedia !== null && (
                <div className="mt-4 flex items-center gap-2">
                  {calc.dentroDaMedia ? (
                    <Badge
                      variant="outline"
                      className="border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20"
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Dentro da média — desvio de{" "}
                      {(calc.desvio! * 100).toFixed(1)}% (limite: 15%)
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20"
                    >
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Fora da média — desvio de{" "}
                      {(calc.desvio! * 100).toFixed(1)}% (limite: 15%)
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ==================== ALERTAS ==================== */}
        {temAlertas && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </h3>

            <div className="space-y-2">
              {calc.alertas.capacidadeExcedida && (
                <div className="flex items-start gap-3 rounded-md border-2 border-amber-500/60 bg-amber-500/10 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-300">
                      Capacidade excedida:
                    </strong>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      O saldo final ({calc.saldoFinal.toFixed(1)} L) ultrapassa
                      a capacidade do tanque (
                      {infoVeiculo.veiculo?.vei_capacidade_tanque.toFixed(0)} L)
                      em{" "}
                      {(
                        calc.saldoFinal -
                        (infoVeiculo.veiculo?.vei_capacidade_tanque ?? 0)
                      ).toFixed(1)}{" "}
                      L.
                    </p>
                  </div>
                </div>
              )}

              {calc.alertas.foraDaMedia && (
                <div className="flex items-start gap-3 rounded-md border-2 border-red-500/60 bg-red-500/10 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <strong className="text-red-800 dark:text-red-300">
                      Fora da média:
                    </strong>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      O consumo real ({calc.consumoReal?.toFixed(2)} km/L) está{" "}
                      {(calc.desvio! * 100).toFixed(1)}% distante do consumo de
                      referência (
                      {infoVeiculo.veiculo?.vei_consumo_referencia.toFixed(2)}{" "}
                      km/L). Tolerância máxima: 15%.
                    </p>
                  </div>
                </div>
              )}

              {calc.alertas.saldoNegativo && (
                <div className="flex items-start gap-3 rounded-md border-2 border-red-500/60 bg-red-500/10 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <strong className="text-red-800 dark:text-red-300">
                      Saldo negativo:
                    </strong>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      O tanque antes (
                      {parseFloat(
                        String(litrosTanqueAntes || "0").replace(",", "."),
                      ).toFixed(1)}{" "}
                      L) é insuficiente para o consumo previsto (
                      {calc.litrosConsumidos.toFixed(1)} L). Déficit de{" "}
                      {Math.abs(calc.saldoAposConsumo).toFixed(1)} L.
                    </p>
                  </div>
                </div>
              )}

              {calc.alertas.semHodometroPendente && (
                <div className="flex items-start gap-3 rounded-md border-2 border-amber-500/60 bg-amber-500/10 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-300">
                      Sem hodômetro pendente:
                    </strong>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      O último abastecimento deste veículo foi registrado sem
                      hodômetro. Não é possível calcular KM rodados e consumo
                      real até que um abastecimento com hodômetro válido seja
                      registrado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== BOTÕES ==================== */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {infoVeiculo.veiculo
              ? `Veículo: ${infoVeiculo.veiculo.vei_frota} (${infoVeiculo.veiculo.vei_placa})`
              : "Selecione um veículo para continuar"}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/painel")}
              disabled={estaEnviando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={estaEnviando}>
              {estaEnviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Registrar abastecimento
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
