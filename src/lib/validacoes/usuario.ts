import { z } from "zod";

export const schemaRegistro = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .email("Email inválido"),
  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  confirmarSenha: z.string(),
}).refine((dados) => dados.senha === dados.confirmarSenha, {
  message: "Senhas não conferem",
  path: ["confirmarSenha"],
});

export const schemaEntrar = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export type DadosRegistro = z.infer<typeof schemaRegistro>;
export type DadosEntrar = z.infer<typeof schemaEntrar>;
