"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth-nativo";
import { schemaMotorista } from "@/lib/validacoes/motorista";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

// ==================== TIPOS ====================

export type MotoristaCompleto = {
  mot_id: number;
  mot_nome: string;
  mot_cpf: string | null;
  mot_ativo: boolean;
};

export type ResultadoMotorista =
  | { sucesso: true; motorista: MotoristaCompleto }
  | { sucesso: false; erro: string; campo?: string };

// ==================== CONSULTAS ====================

export async function listarMotoristas(): Promise<MotoristaCompleto[]> {
  await obterSessao();

  const motoristas = await prisma.motoristas.findMany({
    where: { mot_ativo: true },
    orderBy: { mot_nome: "asc" },
  });

  return motoristas;
}

export async function obterMotoristaPorId(
  id: number,
): Promise<MotoristaCompleto | null> {
  await obterSessao();

  return prisma.motoristas.findUnique({ where: { mot_id: id } });
}

// ==================== MUTAÇÕES ====================

export async function criarMotorista(
  dados: z.input<typeof schemaMotorista>,
): Promise<ResultadoMotorista> {
  await obterSessao();

  const parsed = schemaMotorista.safeParse(dados);
  if (!parsed.success) {
    const primeiroErro = parsed.error.issues[0];
    return {
      sucesso: false,
      erro: primeiroErro.message,
      campo: primeiroErro.path.join("."),
    };
  }

  const { mot_nome, mot_cpf } = parsed.data;

  // Verifica unicidade do nome
  const nomeExistente = await prisma.motoristas.findFirst({
    where: { mot_nome, mot_ativo: true },
  });
  if (nomeExistente) {
    return {
      sucesso: false,
      erro: "Já existe um motorista ativo com este nome",
      campo: "mot_nome",
    };
  }

  // Verifica unicidade do CPF (se informado)
  if (mot_cpf && mot_cpf.trim() !== "") {
    const cpfExistente = await prisma.motoristas.findUnique({
      where: { mot_cpf },
    });
    if (cpfExistente) {
      return {
        sucesso: false,
        erro: "Já existe um motorista com este CPF",
        campo: "mot_cpf",
      };
    }
  }

  const motorista = await prisma.motoristas.create({
    data: {
      mot_nome,
      mot_cpf: mot_cpf && mot_cpf.trim() !== "" ? mot_cpf : null,
    },
  });

  revalidatePath("/motoristas");

  return { sucesso: true, motorista };
}

export async function atualizarMotorista(
  id: number,
  dados: z.input<typeof schemaMotorista>,
): Promise<ResultadoMotorista> {
  await obterSessao();

  const existente = await prisma.motoristas.findUnique({
    where: { mot_id: id },
  });
  if (!existente) {
    return { sucesso: false, erro: "Motorista não encontrado" };
  }

  const parsed = schemaMotorista.safeParse(dados);
  if (!parsed.success) {
    const primeiroErro = parsed.error.issues[0];
    return {
      sucesso: false,
      erro: primeiroErro.message,
      campo: primeiroErro.path.join("."),
    };
  }

  const { mot_nome, mot_cpf } = parsed.data;

  // Verifica unicidade do nome (excluindo o próprio registro)
  const nomeExistente = await prisma.motoristas.findFirst({
    where: { mot_nome, mot_ativo: true, mot_id: { not: id } },
  });
  if (nomeExistente) {
    return {
      sucesso: false,
      erro: "Já existe outro motorista ativo com este nome",
      campo: "mot_nome",
    };
  }

  // Verifica unicidade do CPF (excluindo o próprio registro)
  if (mot_cpf && mot_cpf.trim() !== "") {
    const cpfExistente = await prisma.motoristas.findUnique({
      where: { mot_cpf },
    });
    if (cpfExistente && cpfExistente.mot_id !== id) {
      return {
        sucesso: false,
        erro: "Já existe outro motorista com este CPF",
        campo: "mot_cpf",
      };
    }
  }

  const motorista = await prisma.motoristas.update({
    where: { mot_id: id },
    data: {
      mot_nome,
      mot_cpf: mot_cpf && mot_cpf.trim() !== "" ? mot_cpf : null,
    },
  });

  revalidatePath("/motoristas");

  return { sucesso: true, motorista };
}

export async function desativarMotorista(
  id: number,
): Promise<{ sucesso: boolean; erro?: string }> {
  await obterSessao();

  const existente = await prisma.motoristas.findUnique({
    where: { mot_id: id },
  });
  if (!existente) {
    return { sucesso: false, erro: "Motorista não encontrado" };
  }

  await prisma.motoristas.update({
    where: { mot_id: id },
    data: { mot_ativo: false },
  });

  revalidatePath("/motoristas");

  return { sucesso: true };
}
