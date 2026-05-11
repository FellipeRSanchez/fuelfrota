"use server";

import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth-nativo";
import type { veiculos, abastecimentos } from "@/generated/prisma";

// ==================== TIPOS ====================

export type VeiculoResumo = {
  id: number;
  frota: string;
  placa: string;
  saldoAtual: number;
  ultimoKm: number | null;
  dataUltimoAbastecimento: string | null;
  hodometroAusente: boolean;
  foraDaMedia: boolean;
};

// ==================== CONSULTAS ====================

export async function obterVeiculosAtivos(): Promise<VeiculoResumo[]> {
  await obterSessao(); // garante autenticação

  const veiculos = await prisma.veiculos.findMany({
    where: { vei_ativo: true },
    include: {
      abastecimentos: {
        orderBy: { aba_data_hora: "desc" },
        take: 1,
      },
    },
    orderBy: { vei_frota: "asc" },
  });

  return veiculos.map((v) => mapearVeiculoResumo(v));
}

function mapearVeiculoResumo(
  v: veiculos & { abastecimentos: abastecimentos[] },
): VeiculoResumo {
  const ultimoAbast = v.abastecimentos[0] ?? null;

  return {
    id: v.vei_id,
    frota: v.vei_frota,
    placa: v.vei_placa,
    saldoAtual: ultimoAbast
      ? Number(ultimoAbast.aba_saldo_final)
      : 0,
    ultimoKm: ultimoAbast?.aba_km_hodometro ?? null,
    dataUltimoAbastecimento: ultimoAbast?.aba_data_hora
      ? ultimoAbast.aba_data_hora.toISOString()
      : null,
    hodometroAusente: ultimoAbast?.aba_hodometro_ausente ?? false,
    foraDaMedia: ultimoAbast?.aba_dentro_da_media === false,
  };
}
