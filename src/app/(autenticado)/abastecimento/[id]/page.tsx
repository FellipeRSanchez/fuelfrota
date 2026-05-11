import { obterAbastecimentoPorId } from "@/lib/abastecimentos-crud";
import { obterSessao } from "@/lib/auth-nativo";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Fuel,
  Car,
  User,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Droplets,
  Calendar,
  Timer,
  FileText,
  Info,
} from "lucide-react";

// ==================== FORMATAÇÃO ====================

function formatarData(data: Date | null): string {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarHora(data: Date | null): string {
  if (!data) return "—";
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function formatarKm(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatarCpf(cpf: string | null): string {
  if (!cpf) return "—";
  // Formata CPF: XXX.XXX.XXX-XX
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return cpf;
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// ==================== PROPS ====================

type Props = {
  params: Promise<{ id: string }>;
};

// ==================== COMPONENTE ====================

export default async function PaginaDetalheAbastecimento({ params }: Props) {
  const sessao = await obterSessao();
  if (!sessao) {
    redirect("/login");
  }

  const { id } = await params;
  const idNumerico = Number(id);

  if (isNaN(idNumerico) || idNumerico <= 0) {
    notFound();
  }

  const resultado = await obterAbastecimentoPorId(idNumerico);

  if (!resultado.sucesso) {
    notFound();
  }

  const { abastecimento, alertas } = resultado;

  const temAlertas =
    alertas.capacidadeExcedida ||
    alertas.foraDaMedia ||
    alertas.saldoNegativo ||
    alertas.semHodometroPendente;

  // ==================== RENDER ====================

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/abastecimento">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Abastecimento #{abastecimento.aba_id}
          </h1>
          <p className="text-muted-foreground">
            {formatarData(abastecimento.aba_data_hora)} às{" "}
            {formatarHora(abastecimento.aba_data_hora)}
          </p>
        </div>
      </div>

      {/* ==================== CARDS SUPERIORES: RESUMO ==================== */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Litros aprovados
            </CardTitle>
            <Fuel className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {formatarNumero(abastecimento.aba_litros_aprovados)} L
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50 dark:bg-gray-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              KM hodômetro
            </CardTitle>
            <Gauge className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold">
              {abastecimento.aba_hodometro_ausente
                ? "Sem hodômetro"
                : formatarKm(abastecimento.aba_km_hodometro)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              KM previsto
            </CardTitle>
            <Gauge className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              {formatarKm(abastecimento.aba_km_previsto_rodar)} km
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo final
            </CardTitle>
            <Droplets className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p
              className={`text-xl font-bold ${
                alertas.capacidadeExcedida
                  ? "text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {formatarNumero(abastecimento.aba_saldo_final)} L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==================== CARD: DADOS DO ABASTECIMENTO ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fuel className="h-4 w-4" />
            Dados do Abastecimento
          </CardTitle>
          <CardDescription>
            Informações registradas no momento do abastecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              rotulo="Data"
              valor={formatarData(abastecimento.aba_data_hora)}
              icone={<Calendar className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Hora"
              valor={formatarHora(abastecimento.aba_data_hora)}
              icone={<Timer className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="KM hodômetro"
              valor={
                abastecimento.aba_hodometro_ausente
                  ? "Sem hodômetro"
                  : formatarKm(abastecimento.aba_km_hodometro)
              }
              icone={<Gauge className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Litros no tanque antes"
              valor={`${formatarNumero(abastecimento.aba_litros_tanque_antes)} L`}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Litros aprovados"
              valor={`${formatarNumero(abastecimento.aba_litros_aprovados)} L`}
              destaque
              icone={<Fuel className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="KM previsto rodar"
              valor={`${formatarKm(abastecimento.aba_km_previsto_rodar)} km`}
              icone={<Gauge className="h-3.5 w-3.5" />}
            />
            {abastecimento.aba_observacao && (
              <Campo
                rotulo="Observação"
                valor={abastecimento.aba_observacao}
                icone={<FileText className="h-3.5 w-3.5" />}
                colSpan
              />
            )}
          </dl>
        </CardContent>
      </Card>

      {/* ==================== CARD: DADOS DO VEÍCULO ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Dados do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              rotulo="Frota"
              valor={abastecimento.veiculo.vei_frota}
              destaque
              icone={<Car className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Placa"
              valor={abastecimento.veiculo.vei_placa}
              icone={<Info className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Tipo"
              valor={abastecimento.veiculo.vei_tipo || "—"}
              icone={<Info className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Capacidade do tanque"
              valor={`${formatarNumero(abastecimento.veiculo.vei_capacidade_tanque)} L`}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Consumo de referência"
              valor={`${formatarNumero(abastecimento.veiculo.vei_consumo_referencia)} km/L`}
              icone={<Fuel className="h-3.5 w-3.5" />}
            />
          </dl>
        </CardContent>
      </Card>

      {/* ==================== CARD: DADOS DO MOTORISTA ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Dados do Motorista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              rotulo="Nome"
              valor={abastecimento.motorista.mot_nome}
              destaque
              icone={<User className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="CPF"
              valor={formatarCpf(abastecimento.motorista.mot_cpf)}
              icone={<Info className="h-3.5 w-3.5" />}
            />
          </dl>
        </CardContent>
      </Card>

      {/* ==================== CARD: CÁLCULOS ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" />
            Cálculos
          </CardTitle>
          <CardDescription>
            Valores calculados automaticamente no registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              rotulo="KM rodados"
              valor={
                abastecimento.aba_km_rodados_calculado !== null
                  ? `${formatarKm(abastecimento.aba_km_rodados_calculado)} km`
                  : "—"
              }
              icone={<Gauge className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Consumo real"
              valor={
                abastecimento.aba_consumo_real_calculado !== null
                  ? `${formatarNumero(abastecimento.aba_consumo_real_calculado)} km/L`
                  : "—"
              }
              icone={<Fuel className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Dentro da média"
              valor={
                abastecimento.aba_dentro_da_media === null
                  ? "—"
                  : abastecimento.aba_dentro_da_media
                    ? "Sim"
                    : "Não"
              }
              icone={
                abastecimento.aba_dentro_da_media ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                )
              }
            />
            <Campo
              rotulo="Litros consumidos"
              valor={
                abastecimento.aba_litros_consumidos !== null
                  ? `${formatarNumero(abastecimento.aba_litros_consumidos)} L`
                  : "—"
              }
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Saldo após consumo"
              valor={`${formatarNumero(abastecimento.aba_saldo_apos_consumo)} L`}
              alerta={alertas.saldoNegativo}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Litros necessários"
              valor={`${formatarNumero(abastecimento.aba_litros_necessarios)} L`}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Saldo após abastecer"
              valor={`${formatarNumero(abastecimento.aba_saldo_apos_abastecer)} L`}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
            <Campo
              rotulo="Saldo final"
              valor={`${formatarNumero(abastecimento.aba_saldo_final)} L`}
              destaque
              alerta={alertas.capacidadeExcedida}
              icone={<Droplets className="h-3.5 w-3.5" />}
            />
          </dl>

          {/* Indicador dentro/fora da média */}
          {abastecimento.aba_dentro_da_media !== null &&
            abastecimento.aba_consumo_real_calculado !== null && (
              <div className="mt-4 flex items-center gap-2">
                {abastecimento.aba_dentro_da_media ? (
                  <Badge
                    variant="outline"
                    className="border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Dentro da média — consumo de{" "}
                    {formatarNumero(abastecimento.aba_consumo_real_calculado)}{" "}
                    km/L
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20"
                  >
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    Fora da média — consumo de{" "}
                    {formatarNumero(abastecimento.aba_consumo_real_calculado)}{" "}
                    km/L (ref:{" "}
                    {formatarNumero(
                      abastecimento.veiculo.vei_consumo_referencia,
                    )}{" "}
                    km/L)
                  </Badge>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* ==================== CARD: ALERTAS ==================== */}
      {temAlertas && (
        <Card className="border-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
            <CardDescription>
              Atenção: este abastecimento apresenta as seguintes irregularidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.capacidadeExcedida && (
              <AlertaItem
                titulo="Capacidade excedida"
                cor="amber"
              >
                O saldo final ({formatarNumero(abastecimento.aba_saldo_final)} L)
                ultrapassa a capacidade do tanque (
                {formatarNumero(abastecimento.veiculo.vei_capacidade_tanque)} L)
                em{" "}
                {formatarNumero(
                  abastecimento.aba_saldo_final -
                    abastecimento.veiculo.vei_capacidade_tanque,
                )}{" "}
                L.
              </AlertaItem>
            )}

            {alertas.foraDaMedia && (
              <AlertaItem
                titulo="Fora da média"
                cor="red"
              >
                O consumo real (
                {formatarNumero(abastecimento.aba_consumo_real_calculado)} km/L)
                difere significativamente do consumo de referência (
                {formatarNumero(abastecimento.veiculo.vei_consumo_referencia)}{" "}
                km/L). Tolerância máxima: 15%.
              </AlertaItem>
            )}

            {alertas.saldoNegativo && (
              <AlertaItem
                titulo="Saldo negativo"
                cor="red"
              >
                O tanque antes (
                {formatarNumero(abastecimento.aba_litros_tanque_antes)} L) é
                insuficiente para o consumo previsto (
                {formatarNumero(abastecimento.aba_litros_consumidos)} L).
                Déficit de{" "}
                {formatarNumero(
                  Math.abs(abastecimento.aba_saldo_apos_consumo),
                )}{" "}
                L.
              </AlertaItem>
            )}

            {alertas.semHodometroPendente && (
              <AlertaItem
                titulo="Sem hodômetro pendente"
                cor="amber"
              >
                O abastecimento anterior deste veículo foi registrado sem
                hodômetro. Não é possível calcular KM rodados e consumo real até
                que um abastecimento com hodômetro válido seja registrado.
              </AlertaItem>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sem alertas — indicador verde */}
      {!temAlertas && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Nenhum alerta neste abastecimento. Todos os indicadores estão dentro
          do esperado.
        </div>
      )}

      {/* Botão voltar */}
      <div className="flex justify-start pt-2">
        <Button variant="outline" asChild>
          <Link href="/abastecimento">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para listagem
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ==================== COMPONENTES INTERNOS ====================

function Campo({
  rotulo,
  valor,
  destaque,
  alerta,
  colSpan,
  icone,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  alerta?: boolean;
  colSpan?: boolean;
  icone?: React.ReactNode;
}) {
  return (
    <div className={colSpan ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icone}
        {rotulo}
      </dt>
      <dd
        className={`mt-0.5 text-sm ${
          alerta
            ? "font-semibold text-red-600 dark:text-red-400"
            : destaque
              ? "font-semibold"
              : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function AlertaItem({
  titulo,
  cor,
  children,
}: {
  titulo: string;
  cor: "amber" | "red";
  children: React.ReactNode;
}) {
  const estilosBorda =
    cor === "red"
      ? "border-red-500/60 bg-red-500/10"
      : "border-amber-500/60 bg-amber-500/10";
  const estilosIcone =
    cor === "red" ? "text-red-600" : "text-amber-600";
  const estilosTitulo =
    cor === "red"
      ? "text-red-800 dark:text-red-300"
      : "text-amber-800 dark:text-amber-300";
  const estilosTexto =
    cor === "red"
      ? "text-red-700 dark:text-red-400"
      : "text-amber-700 dark:text-amber-400";

  return (
    <div
      className={`flex items-start gap-3 rounded-md border-2 px-4 py-3 ${estilosBorda}`}
    >
      <AlertTriangle
        className={`mt-0.5 h-5 w-5 shrink-0 ${estilosIcone}`}
      />
      <div>
        <strong className={estilosTitulo}>{titulo}:</strong>
        <p className={`text-sm ${estilosTexto}`}>{children}</p>
      </div>
    </div>
  );
}
