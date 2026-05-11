import { z } from "zod";

export const schemaAbastecimento = z
  .object({
    vei_id: z
      .union([z.string(), z.number()])
      .refine((v) => String(v).trim() !== "", { message: "Selecione um veículo" })
      .transform((v) => Number(v))
      .pipe(
        z.number({ message: "Veículo inválido" })
          .int()
          .positive(),
      ),
    mot_id: z
      .union([z.string(), z.number()])
      .refine((v) => String(v).trim() !== "", { message: "Selecione um motorista" })
      .transform((v) => Number(v))
      .pipe(z.number({ message: "Motorista inválido" }).int().positive()),
    hodometro_ausente: z.boolean().default(false),
    km_hodometro: z.union([z.string(), z.number()]).default(""),
    litros_tanque_antes: z
      .union([z.string(), z.number()])
      .refine((v) => String(v).trim() !== "", { message: "Litros no tanque é obrigatório" })
      .transform((v) => Number(String(v).replace(",", ".")))
      .pipe(
        z
          .number({ message: "Deve ser um número" })
          .nonnegative("Não pode ser negativo"),
      ),
    litros_aprovados: z
      .union([z.string(), z.number()])
      .refine((v) => String(v).trim() !== "", { message: "Litros aprovados é obrigatório" })
      .transform((v) => Number(String(v).replace(",", ".")))
      .pipe(
        z
          .number({ message: "Deve ser um número" })
          .positive("Deve ser positivo"),
      ),
    km_previsto_rodar: z
      .union([z.string(), z.number()])
      .refine((v) => String(v).trim() !== "", { message: "KM previsto é obrigatório" })
      .transform((v) => Number(String(v).replace(",", ".")))
      .pipe(
        z
          .number({ message: "Deve ser um número" })
          .positive("Deve ser positivo"),
      ),
  })
  .superRefine((dados, ctx) => {
    // Se hodômetro NÃO está ausente, KM é obrigatório
    if (!dados.hodometro_ausente) {
      const km = Number(String(dados.km_hodometro).replace(",", "."));
      if (!dados.km_hodometro || dados.km_hodometro.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "KM do hodômetro é obrigatório",
          path: ["km_hodometro"],
        });
      } else if (isNaN(km) || km < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "KM deve ser um número positivo",
          path: ["km_hodometro"],
        });
      }
    }
  });

export type DadosAbastecimento = z.infer<typeof schemaAbastecimento>;

// Tipo usado no formulário (antes da transformação)
export type FormValuesAbastecimento = z.input<typeof schemaAbastecimento>;
