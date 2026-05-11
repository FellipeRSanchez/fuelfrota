import { z } from "zod";

// Formato de placa brasileira: AAA-1234 ou AAA1A23 (Mercosul)
const regexPlaca = /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;

export const schemaVeiculo = z.object({
  vei_frota: z
    .string()
    .min(1, "Frota é obrigatória")
    .max(50, "Frota deve ter no máximo 50 caracteres"),
  vei_placa: z
    .string()
    .min(1, "Placa é obrigatória")
    .max(10, "Placa deve ter no máximo 10 caracteres")
    .regex(regexPlaca, "Formato de placa inválido (ex: ABC-1234 ou ABC1D23)")
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  vei_tipo: z
    .string()
    .max(50, "Tipo deve ter no máximo 50 caracteres")
    .optional()
    .default(""),
  vei_capacidade_tanque: z
    .union([z.string().min(1, "Capacidade do tanque é obrigatória"), z.number()])
    .transform((v) => Number(String(v).replace(",", ".")))
    .pipe(
      z
        .number({ message: "Capacidade deve ser um número" })
        .positive("Capacidade deve ser positiva")
        .max(99999, "Capacidade muito alta"),
    ),
  vei_consumo_referencia: z
    .union([z.string().min(1, "Consumo de referência é obrigatório"), z.number()])
    .transform((v) => Number(String(v).replace(",", ".")))
    .pipe(
      z
        .number({ message: "Consumo deve ser um número" })
        .positive("Consumo deve ser positivo")
        .max(99, "Consumo muito alto"),
    ),
});

export type DadosVeiculo = z.infer<typeof schemaVeiculo>;
