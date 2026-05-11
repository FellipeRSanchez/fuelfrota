"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth-nativo";
import { z } from "zod";

// ==================== TIPOS ====================

export type DadosConsumoVeiculo = {
  vei_id: number;
  vei_frota: string;
  vei_placa: string;
  vei_consumo_referencia: number;
  abastecimentos: {
    aba_id: number;
    data: string;
    consumoReal: number | null;
    consumoReferencia: number;
    kmRodados: number | null;
    litrosAprovados: number;
  }[];
};

export type ResumoConsumo = {
  vei_id: number;
  vei_frota: string;
  vei_placa: string;
  consumoReferencia: number;
  consumoRealMedio: number | null;
  totalAbastecimentos: number;
  totalLitros: number;
  totalKmRodados: number | null;
};

export type FiltrosRelatorio = {
  vei_id?: number;
  dataInicio?: string;
  dataFim?: string;
};

// ==================== SCHEMA ====================

const schemaFiltrosRelatorio = z.object({
  vei_id: z.number().int().positive().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

// ==================== CONSULTAS ====================

export async function obterDadosConsumoPorVeiculo(
  filtros: FiltrosRelatorio = {},
): Promise<DadosConsumoVeiculo[]> {
  await obterSessao();

  const parsed = schemaFiltrosRelatorio.safeParse(filtros);
  if (!parsed.success) {
    return [];
  }

  const { vei_id, dataInicio, dataFim } = parsed.data;

  // Define período padrão: últimos 30 dias se não especificado
  const dataFimDate = dataFim ? new Date(dataFim) : new Date();
  dataFimDate.setHours(23, 59, 59, 999);

  const dataInicioDate = dataInicio
    ? new Date(dataInicio)
    : new Date(dataFimDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  dataInicioDate.setHours(0, 0, 0, 0);

  // Busca veículos ativos (filtrado ou todos)
  const whereVeiculo: Record<string, unknown> = { vei_ativo: true };
  if (vei_id) {
    whereVeiculo.vei_id = vei_id;
  }

  const veiculos = await prisma.veiculos.findMany({
    where: whereVeiculo,
    orderBy: { vei_frota: "asc" },
    include: {
      abastecimentos: {
        where: {
          aba_data_hora: {
            gte: dataInicioDate,
            lte: dataFimDate,
          },
        },
        orderBy: { aba_data_hora: "asc" },
        select: {
          aba_id: true,
          aba_data_hora: true,
          aba_consumo_real_calculado: true,
          aba_km_rodados_calculado: true,
          aba_litros_aprovados: true,
        },
      },
    },
  });

  return veiculos.map((v) => ({
    vei_id: v.vei_id,
    vei_frota: v.vei_frota,
    vei_placa: v.vei_placa,
    vei_consumo_referencia: Number(v.vei_consumo_referencia),
    abastecimentos: v.abastecimentos.map((a) => ({
      aba_id: a.aba_id,
      data: a.aba_data_hora?.toISOString().split("T")[0] ?? "",
      consumoReal: a.aba_consumo_real_calculado
        ? Number(a.aba_consumo_real_calculado)
        : null,
      consumoReferencia: Number(v.vei_consumo_referencia),
      kmRodados: a.aba_km_rodados_calculado
        ? Number(a.aba_km_rodados_calculado)
        : null,
      litrosAprovados: Number(a.aba_litros_aprovados),
    })),
  }));
}

export async function obterResumoConsumo(
  filtros: FiltrosRelatorio = {},
): Promise<ResumoConsumo[]> {
  await obterSessao();

  const parsed = schemaFiltrosRelatorio.safeParse(filtros);
  if (!parsed.success) {
    return [];
  }

  const { vei_id, dataInicio, dataFim } = parsed.data;

  const dataFimDate = dataFim ? new Date(dataFim) : new Date();
  dataFimDate.setHours(23, 59, 59, 999);

  const dataInicioDate = dataInicio
    ? new Date(dataInicio)
    : new Date(dataFimDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  dataInicioDate.setHours(0, 0, 0, 0);

  const whereVeiculo: Record<string, unknown> = { vei_ativo: true };
  if (vei_id) {
    whereVeiculo.vei_id = vei_id;
  }

  const veiculos = await prisma.veiculos.findMany({
    where: whereVeiculo,
    orderBy: { vei_frota: "asc" },
    include: {
      abastecimentos: {
        where: {
          aba_data_hora: {
            gte: dataInicioDate,
            lte: dataFimDate,
          },
        },
        select: {
          aba_consumo_real_calculado: true,
          aba_km_rodados_calculado: true,
          aba_litros_aprovados: true,
        },
      },
    },
  });

  return veiculos.map((v) => {
    const consumosReais: number[] = [];
    for (const a of v.abastecimentos) {
      if (a.aba_consumo_real_calculado !== null) {
        consumosReais.push(Number(a.aba_consumo_real_calculado));
      }
    }

    const kmRodados: number[] = [];
    for (const a of v.abastecimentos) {
      if (a.aba_km_rodados_calculado !== null) {
        kmRodados.push(Number(a.aba_km_rodados_calculado));
      }
    }

    return {
      vei_id: v.vei_id,
      vei_frota: v.vei_frota,
      vei_placa: v.vei_placa,
      consumoReferencia: Number(v.vei_consumo_referencia),
      consumoRealMedio:
        consumosReais.length > 0
          ? consumosReais.reduce((s, c) => s + c, 0) / consumosReais.length
          : null,
      totalAbastecimentos: v.abastecimentos.length,
      totalLitros: v.abastecimentos.reduce(
        (s, a) => s + Number(a.aba_litros_aprovados),
        0,
      ),
      totalKmRodados:
        kmRodados.length > 0
          ? kmRodados.reduce((s, k) => s + k, 0)
          : null,
    };
  });
}
