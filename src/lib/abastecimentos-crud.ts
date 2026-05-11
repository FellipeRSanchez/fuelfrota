"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth-nativo";
import { schemaAbastecimento } from "@/lib/validacoes/abastecimento";
import type { z } from "zod";
import { revalidatePath } from "next/cache";
import type { abastecimentos } from "@/generated/prisma";

// ==================== TIPOS ====================

export type AbastecimentoCompleto = {
  aba_id: number;
  aba_vei_id: number;
  aba_mot_id: number;
  aba_data_hora: Date | null;
  aba_km_hodometro: number | null;
  aba_hodometro_ausente: boolean | null;
  aba_litros_tanque_antes: number;
  aba_litros_aprovados: number;
  aba_km_previsto_rodar: number;
  aba_km_rodados_calculado: number | null;
  aba_consumo_real_calculado: number | null;
  aba_dentro_da_media: boolean | null;
  aba_litros_consumidos: number | null;
  aba_saldo_apos_consumo: number;
  aba_litros_necessarios: number;
  aba_saldo_apos_abastecer: number;
  aba_saldo_final: number;
};

export type AbastecimentoListagemItem = {
  aba_id: number;
  aba_data_hora: Date | null;
  aba_km_hodometro: number | null;
  aba_hodometro_ausente: boolean | null;
  aba_litros_aprovados: number;
  aba_km_rodados_calculado: number | null;
  aba_consumo_real_calculado: number | null;
  aba_dentro_da_media: boolean | null;
  veiculo: { vei_frota: string; vei_placa: string; vei_capacidade_tanque: number };
  motorista: { mot_nome: string };
};

export type FiltrosAbastecimento = {
  vei_id?: number;
  mot_id?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
};

export type ResultadoListagemAbastecimento = {
  items: AbastecimentoListagemItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type AlertasAbastecimento = {
  capacidadeExcedida: boolean;
  foraDaMedia: boolean;
  saldoNegativo: boolean;
  semHodometroPendente: boolean;
};

export type ResultadoAbastecimento =
  | {
      sucesso: true;
      abastecimento: AbastecimentoCompleto;
      alertas: AlertasAbastecimento;
    }
  | { sucesso: false; erro: string; campo?: string };

// ==================== CONSULTAS AUXILIARES ====================

export async function obterUltimoAbastecimentoComHodometro(
  vei_id: number,
): Promise<abastecimentos | null> {
  await obterSessao();

  return prisma.abastecimentos.findFirst({
    where: {
      aba_vei_id: vei_id,
      aba_hodometro_ausente: false,
      aba_km_hodometro: { not: null },
    },
    orderBy: { aba_data_hora: "desc" },
  });
}

export async function obterUltimoAbastecimento(
  vei_id: number,
): Promise<abastecimentos | null> {
  await obterSessao();

  return prisma.abastecimentos.findFirst({
    where: { aba_vei_id: vei_id },
    orderBy: { aba_data_hora: "desc" },
  });
}

// ==================== MUTAÇÕES ====================

export async function criarAbastecimento(
  dados: z.input<typeof schemaAbastecimento>,
): Promise<ResultadoAbastecimento> {
  await obterSessao();

  // Log raw input received from the form for debugging
  console.log("[Debug] Dados recebidos no criarAbastecimento:", dados);

  const parsed = schemaAbastecimento.safeParse(dados);
  if (!parsed.success) {
    const primeiroErro = parsed.error.issues[0];
    return {
      sucesso: false,
      erro: primeiroErro.message,
      campo: primeiroErro.path.join("."),
    };
  }

  const {
    vei_id,
    mot_id,
    hodometro_ausente,
    km_hodometro,
    litros_tanque_antes,
    litros_aprovados,
    km_previsto_rodar,
  } = parsed.data;

  // Log parsed and transformed data before DB operations
  console.log("[Debug] Dados validados e transformados:", {
    vei_id,
    mot_id,
    hodometro_ausente,
    km_hodometro,
    litros_tanque_antes,
    litros_aprovados,
    km_previsto_rodar,
  });

  // Valida existência do motorista
  const motorista = await prisma.motoristas.findUnique({
    where: { mot_id, mot_ativo: true },
  });
  if (!motorista) {
    return {
      sucesso: false,
      erro: "Motorista não encontrado ou inativo",
      campo: "mot_id",
    };
  }

  // Busca o veículo para obter consumo de referência e capacidade
  const veiculo = await prisma.veiculos.findUnique({
    where: { vei_id, vei_ativo: true },
  });
  if (!veiculo) {
    return {
      sucesso: false,
      erro: "Veículo não encontrado ou inativo",
      campo: "vei_id",
    };
  }

  const consumoReferencia = Number(veiculo.vei_consumo_referencia);
  const capacidadeTanque = Number(veiculo.vei_capacidade_tanque);

  // Busca último abastecimento para obter saldo anterior e status hodômetro
  const ultimoAbastecimento = await obterUltimoAbastecimento(vei_id);

  // Busca último abastecimento com hodômetro válido para calcular KM rodados
  const ultimoComHodometro =
    await obterUltimoAbastecimentoComHodometro(vei_id);

  // ---- CÁLCULOS ----

  // Litros consumidos = KM previsto / consumo referência (km/L → L)
  const litrosConsumidos =
    consumoReferencia > 0 ? km_previsto_rodar / consumoReferencia : 0;

  // Saldo após consumo = tanque antes - consumo previsto
  const saldoAposConsumo = litros_tanque_antes - litrosConsumidos;

  // Litros necessários = máximo entre 0 e (consumo - tanque antes)
  const litrosNecessarios = Math.max(0, litrosConsumidos - litros_tanque_antes);

  // Saldo após abastecer = saldo após consumo + litros aprovados
  const saldoAposAbastecer = saldoAposConsumo + litros_aprovados;

  // Saldo final = tanque antes + litros aprovados
  const saldoFinal = litros_tanque_antes + litros_aprovados;

  // KM hodômetro efetivo (null se ausente)
  const kmHodometroEfetivo = hodometro_ausente ? null : Number(km_hodometro);

  // KM rodados = KM atual - último KM válido (só se ambos existirem)
  let kmRodados: number | null = null;
  let consumoReal: number | null = null;
  let dentroDaMedia: boolean | null = null;

  if (
    kmHodometroEfetivo !== null &&
    kmHodometroEfetivo > 0 &&
    ultimoComHodometro?.aba_km_hodometro !== null &&
    ultimoComHodometro?.aba_km_hodometro !== undefined
  ) {
    kmRodados = kmHodometroEfetivo - ultimoComHodometro.aba_km_hodometro;

    if (kmRodados > 0 && litros_aprovados > 0 && consumoReferencia > 0) {
      consumoReal = kmRodados / litros_aprovados;
      const desvio =
        Math.abs(consumoReal - consumoReferencia) / consumoReferencia;
      dentroDaMedia = desvio <= 0.15;
    }
  }

  // ---- ALERTAS (calculados antes de salvar) ----
  const alertas: AlertasAbastecimento = {
    capacidadeExcedida: capacidadeTanque > 0 && saldoFinal > capacidadeTanque,
    foraDaMedia: dentroDaMedia === false,
    saldoNegativo:
      litros_tanque_antes > 0 &&
      km_previsto_rodar > 0 &&
      saldoAposConsumo < 0,
    semHodometroPendente: ultimoAbastecimento?.aba_hodometro_ausente === true,
  };

  // Salva no banco com todos os campos calculados
  const abastecimento = await prisma.abastecimentos.create({
    data: {
      aba_vei_id: vei_id,
      aba_mot_id: mot_id,
      aba_km_hodometro: kmHodometroEfetivo,
      aba_hodometro_ausente: hodometro_ausente,
      aba_litros_tanque_antes: litros_tanque_antes,
      aba_litros_aprovados: litros_aprovados,
      aba_km_previsto_rodar: km_previsto_rodar,
      aba_km_rodados_calculado: kmRodados,
      aba_consumo_real_calculado: consumoReal,
      aba_dentro_da_media: dentroDaMedia,
      aba_litros_consumidos: litrosConsumidos,
      aba_saldo_apos_consumo: saldoAposConsumo,
      aba_litros_necessarios: litrosNecessarios,
      aba_saldo_apos_abastecer: saldoAposAbastecer,
      aba_saldo_final: saldoFinal,
    },
  });

  revalidatePath("/abastecimento/novo");
  revalidatePath("/abastecimento");
  revalidatePath("/painel");

  return {
    sucesso: true,
    abastecimento: mapearAbastecimento(abastecimento),
    alertas,
  };
}

// ==================== LISTAGEM ====================

export async function listarAbastecimentos(
  filtros: FiltrosAbastecimento = {},
): Promise<ResultadoListagemAbastecimento> {
  await obterSessao();

  const { vei_id, mot_id, dataInicio, dataFim, page = 1, limit = 10 } = filtros;

  const where: Record<string, unknown> = {};

  if (vei_id) {
    where.aba_vei_id = vei_id;
  }

  if (mot_id) {
    where.aba_mot_id = mot_id;
  }

  if (dataInicio || dataFim) {
    const dataFilter: Record<string, Date> = {};
    if (dataInicio) {
      dataFilter.gte = new Date(dataInicio);
    }
    if (dataFim) {
      // fim do dia para incluir o dia inteiro
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      dataFilter.lte = fim;
    }
    where.aba_data_hora = dataFilter;
  }

  const [items, total] = await Promise.all([
    prisma.abastecimentos.findMany({
      where,
      include: {
        veiculos: {
          select: {
            vei_frota: true,
            vei_placa: true,
            vei_capacidade_tanque: true,
          },
        },
        motoristas: {
          select: { mot_nome: true },
        },
      },
      orderBy: { aba_data_hora: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.abastecimentos.count({ where }),
  ]);

  const mapped: AbastecimentoListagemItem[] = items.map((a) => ({
    aba_id: a.aba_id,
    aba_data_hora: a.aba_data_hora,
    aba_km_hodometro: a.aba_km_hodometro,
    aba_hodometro_ausente: a.aba_hodometro_ausente,
    aba_litros_aprovados: Number(a.aba_litros_aprovados),
    aba_km_rodados_calculado: a.aba_km_rodados_calculado
      ? Number(a.aba_km_rodados_calculado)
      : null,
    aba_consumo_real_calculado: a.aba_consumo_real_calculado
      ? Number(a.aba_consumo_real_calculado)
      : null,
    aba_dentro_da_media: a.aba_dentro_da_media,
    veiculo: {
      vei_frota: a.veiculos.vei_frota,
      vei_placa: a.veiculos.vei_placa,
      vei_capacidade_tanque: Number(a.veiculos.vei_capacidade_tanque),
    },
    motorista: { mot_nome: a.motoristas.mot_nome },
  }));

  return {
    items: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== DETALHE ====================

export type AbastecimentoDetalhe = {
  aba_id: number;
  aba_data_hora: Date | null;
  aba_km_hodometro: number | null;
  aba_hodometro_ausente: boolean | null;
  aba_litros_tanque_antes: number;
  aba_litros_aprovados: number;
  aba_km_previsto_rodar: number;
  aba_km_rodados_calculado: number | null;
  aba_consumo_real_calculado: number | null;
  aba_dentro_da_media: boolean | null;
  aba_observacao: string | null;
  aba_litros_consumidos: number | null;
  aba_saldo_apos_consumo: number;
  aba_litros_necessarios: number;
  aba_saldo_apos_abastecer: number;
  aba_saldo_final: number;
  veiculo: {
    vei_frota: string;
    vei_placa: string;
    vei_tipo: string | null;
    vei_capacidade_tanque: number;
    vei_consumo_referencia: number;
  };
  motorista: {
    mot_nome: string;
    mot_cpf: string | null;
  };
};

export type AlertasDetalhe = {
  capacidadeExcedida: boolean;
  foraDaMedia: boolean;
  saldoNegativo: boolean;
  semHodometroPendente: boolean;
};

export type ResultadoDetalheAbastecimento =
  | {
      sucesso: true;
      abastecimento: AbastecimentoDetalhe;
      alertas: AlertasDetalhe;
    }
  | { sucesso: false; erro: string };

export async function obterAbastecimentoPorId(
  id: number,
): Promise<ResultadoDetalheAbastecimento> {
  await obterSessao();

  const abastecimento = await prisma.abastecimentos.findUnique({
    where: { aba_id: id },
    include: {
      veiculos: true,
      motoristas: true,
    },
  });

  if (!abastecimento) {
    return { sucesso: false, erro: "Abastecimento não encontrado" };
  }

  // Busca o abastecimento anterior do mesmo veículo para verificar hodômetro pendente
  const anterior = await prisma.abastecimentos.findFirst({
    where: {
      aba_vei_id: abastecimento.aba_vei_id,
      aba_id: { lt: abastecimento.aba_id },
    },
    orderBy: { aba_id: "desc" },
    select: { aba_hodometro_ausente: true },
  });

  const capacidadeTanque = Number(abastecimento.veiculos.vei_capacidade_tanque);
  const saldoFinal = Number(abastecimento.aba_saldo_final);
  const saldoAposConsumo = Number(abastecimento.aba_saldo_apos_consumo);

  const alertas: AlertasDetalhe = {
    capacidadeExcedida: capacidadeTanque > 0 && saldoFinal > capacidadeTanque,
    foraDaMedia: abastecimento.aba_dentro_da_media === false,
    saldoNegativo: saldoAposConsumo < 0,
    semHodometroPendente: anterior?.aba_hodometro_ausente === true,
  };

  return {
    sucesso: true,
    abastecimento: {
      aba_id: abastecimento.aba_id,
      aba_data_hora: abastecimento.aba_data_hora,
      aba_km_hodometro: abastecimento.aba_km_hodometro,
      aba_hodometro_ausente: abastecimento.aba_hodometro_ausente,
      aba_litros_tanque_antes: Number(abastecimento.aba_litros_tanque_antes),
      aba_litros_aprovados: Number(abastecimento.aba_litros_aprovados),
      aba_km_previsto_rodar: Number(abastecimento.aba_km_previsto_rodar),
      aba_km_rodados_calculado: abastecimento.aba_km_rodados_calculado
        ? Number(abastecimento.aba_km_rodados_calculado)
        : null,
      aba_consumo_real_calculado: abastecimento.aba_consumo_real_calculado
        ? Number(abastecimento.aba_consumo_real_calculado)
        : null,
      aba_dentro_da_media: abastecimento.aba_dentro_da_media,
      aba_observacao: abastecimento.aba_observacao,
      aba_litros_consumidos: abastecimento.aba_litros_consumidos
        ? Number(abastecimento.aba_litros_consumidos)
        : null,
      aba_saldo_apos_consumo: saldoAposConsumo,
      aba_litros_necessarios: Number(abastecimento.aba_litros_necessarios),
      aba_saldo_apos_abastecer: Number(abastecimento.aba_saldo_apos_abastecer),
      aba_saldo_final: saldoFinal,
      veiculo: {
        vei_frota: abastecimento.veiculos.vei_frota,
        vei_placa: abastecimento.veiculos.vei_placa,
        vei_tipo: abastecimento.veiculos.vei_tipo,
        vei_capacidade_tanque: capacidadeTanque,
        vei_consumo_referencia: Number(abastecimento.veiculos.vei_consumo_referencia),
      },
      motorista: {
        mot_nome: abastecimento.motoristas.mot_nome,
        mot_cpf: abastecimento.motoristas.mot_cpf,
      },
    },
    alertas,
  };
}

// ==================== HELPERS ====================

function mapearAbastecimento(a: abastecimentos): AbastecimentoCompleto {
  return {
    aba_id: a.aba_id,
    aba_vei_id: a.aba_vei_id,
    aba_mot_id: a.aba_mot_id,
    aba_data_hora: a.aba_data_hora,
    aba_km_hodometro: a.aba_km_hodometro,
    aba_hodometro_ausente: a.aba_hodometro_ausente,
    aba_litros_tanque_antes: Number(a.aba_litros_tanque_antes),
    aba_litros_aprovados: Number(a.aba_litros_aprovados),
    aba_km_previsto_rodar: Number(a.aba_km_previsto_rodar),
    aba_km_rodados_calculado: a.aba_km_rodados_calculado
      ? Number(a.aba_km_rodados_calculado)
      : null,
    aba_consumo_real_calculado: a.aba_consumo_real_calculado
      ? Number(a.aba_consumo_real_calculado)
      : null,
    aba_dentro_da_media: a.aba_dentro_da_media,
    aba_litros_consumidos: a.aba_litros_consumidos
      ? Number(a.aba_litros_consumidos)
      : null,
    aba_saldo_apos_consumo: Number(a.aba_saldo_apos_consumo),
    aba_litros_necessarios: Number(a.aba_litros_necessarios),
    aba_saldo_apos_abastecer: Number(a.aba_saldo_apos_abastecer),
    aba_saldo_final: Number(a.aba_saldo_final),
  };
}
