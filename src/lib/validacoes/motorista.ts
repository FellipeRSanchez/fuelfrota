import { z } from "zod";

// Validação de CPF (dígitos verificadores)
function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, "");

  if (limpo.length !== 11) return false;

  // Rejeita sequências iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Valida dígitos verificadores
  for (let j = 9; j <= 10; j++) {
    let soma = 0;
    for (let i = 0; i < j; i++) {
      soma += parseInt(limpo.charAt(i)) * (j + 1 - i);
    }
    const resto = (soma * 10) % 11;
    if (resto === 10) continue; // resto 10 = 0
    if (resto !== parseInt(limpo.charAt(j))) return false;
  }

  return true;
}

export const schemaMotorista = z.object({
  mot_nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  mot_cpf: z
    .string()
    .max(14, "CPF deve ter no máximo 14 caracteres")
    .default("")
    .refine(
      (v) => {
        if (!v || v.trim() === "") return true; // CPF opcional
        return validarCPF(v);
      },
      { message: "CPF inválido" },
    ),
});

export type DadosMotorista = z.infer<typeof schemaMotorista>;
