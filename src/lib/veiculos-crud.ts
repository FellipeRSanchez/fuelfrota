"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth-nativo";
import { schemaVeiculo } from "@/lib/validacoes/veiculo";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

// ==================== TIPOS ====================

export type VeiculoCompleto = {
  vei_id: number;
  vei_frota: string;
  vei_placa: string;
  vei_tipo: string | null;
  vei_capacidade_tanque: number;
  vei_consumo_referencia: number;
  vei_ativo: boolean;
};

export type ResultadoVeiculo =
  | { sucesso: true; veiculo: VeiculoCompleto }
  | { sucesso: false; erro: string; campo?: string };

// ==================== CONSULTAS ====================

export async function listarVeiculos(): Promise<VeiculoCompleto[]> {
  await obterSessao();

  const veiculos = await prisma.veiculos.findMany({
    where: { vei_ativo: true },
    orderBy: { vei_frota: "asc" },
  });

  return veiculos.map((v) => ({
    ...v,
    vei_capacidade_tanque: Number(v.vei_capacidade_tanque),
    vei_consumo_referencia: Number(v.vei_consumo_referencia),
  }));
}

export async function obterVeiculoPorId(
  id: number,
): Promise<VeiculoCompleto | null> {
  await obterSessao();

  const v = await prisma.veiculos.findUnique({ where: { vei_id: id } });
  if (!v) return null;

  return {
    ...v,
    vei_capacidade_tanque: Number(v.vei_capacidade_tanque),
    vei_consumo_referencia: Number(v.vei_consumo_referencia),
  };
}

// ==================== MUTAÇÕES ====================

export async function criarVeiculo(
  dados: z.input<typeof schemaVeiculo>,
): Promise<ResultadoVeiculo> {
  await obterSessao();

  const parsed = schemaVeiculo.safeParse(dados);
  if (!parsed.success) {
    const primeiroErro = parsed.error.issues[0];
    return {
      sucesso: false,
      erro: primeiroErro.message,
      campo: primeiroErro.path.join("."),
    };
  }

  const { vei_frota, vei_placa, vei_tipo, vei_capacidade_tanque, vei_consumo_referencia } =
    parsed.data;

  // Verifica unicidade da placa
  const placaExistente = await prisma.veiculos.findUnique({
    where: { vei_placa },
  });
  if (placaExistente) {
    return {
      sucesso: false,
      erro: "Já existe um veículo com esta placa",
      campo: "vei_placa",
    };
  }

  // Verifica unicidade da frota
  const frotaExistente = await prisma.veiculos.findFirst({
    where: { vei_frota, vei_ativo: true },
  });
  if (frotaExistente) {
    return {
      sucesso: false,
      erro: "Já existe um veículo ativo com esta frota",
      campo: "vei_frota",
    };
  }

  const veiculo = await prisma.veiculos.create({
    data: {
      vei_frota,
      vei_placa,
      vei_tipo: vei_tipo || null,
      vei_capacidade_tanque: vei_capacidade_tanque,
      vei_consumo_referencia: vei_consumo_referencia,
    },
  });

  revalidatePath("/veiculos");

  return {
    sucesso: true,
    veiculo: {
      ...veiculo,
      vei_capacidade_tanque: Number(veiculo.vei_capacidade_tanque),
      vei_consumo_referencia: Number(veiculo.vei_consumo_referencia),
    },
  };
}

export async function atualizarVeiculo(
  id: number,
  dados: z.input<typeof schemaVeiculo>,
): Promise<ResultadoVeiculo> {
  await obterSessao();

  const existente = await prisma.veiculos.findUnique({
    where: { vei_id: id },
  });
  if (!existente) {
    return { sucesso: false, erro: "Veículo não encontrado" };
  }

  const parsed = schemaVeiculo.safeParse(dados);
  if (!parsed.success) {
    const primeiroErro = parsed.error.issues[0];
    return {
      sucesso: false,
      erro: primeiroErro.message,
      campo: primeiroErro.path.join("."),
    };
  }

  const { vei_frota, vei_placa, vei_tipo, vei_capacidade_tanque, vei_consumo_referencia } =
    parsed.data;

  // Verifica unicidade da placa (excluindo o próprio registro)
  const placaExistente = await prisma.veiculos.findUnique({
    where: { vei_placa },
  });
  if (placaExistente && placaExistente.vei_id !== id) {
    return {
      sucesso: false,
      erro: "Já existe outro veículo com esta placa",
      campo: "vei_placa",
    };
  }

  // Verifica unicidade da frota (excluindo o próprio registro)
  const frotaExistente = await prisma.veiculos.findFirst({
    where: { vei_frota, vei_ativo: true, vei_id: { not: id } },
  });
  if (frotaExistente) {
    return {
      sucesso: false,
      erro: "Já existe outro veículo ativo com esta frota",
      campo: "vei_frota",
    };
  }

  const veiculo = await prisma.veiculos.update({
    where: { vei_id: id },
    data: {
      vei_frota,
      vei_placa,
      vei_tipo: vei_tipo || null,
      vei_capacidade_tanque: vei_capacidade_tanque,
      vei_consumo_referencia: vei_consumo_referencia,
    },
  });

  revalidatePath("/veiculos");

  return {
    sucesso: true,
    veiculo: {
      ...veiculo,
      vei_capacidade_tanque: Number(veiculo.vei_capacidade_tanque),
      vei_consumo_referencia: Number(veiculo.vei_consumo_referencia),
    },
  };
}

export async function desativarVeiculo(
  id: number,
): Promise<{ sucesso: boolean; erro?: string }> {
  await obterSessao();

  const existente = await prisma.veiculos.findUnique({
    where: { vei_id: id },
  });
  if (!existente) {
    return { sucesso: false, erro: "Veículo não encontrado" };
  }

  await prisma.veiculos.update({
    where: { vei_id: id },
    data: { vei_ativo: false },
  });

  revalidatePath("/veiculos");

  return { sucesso: true };
}
