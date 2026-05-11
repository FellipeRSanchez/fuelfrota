"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schemaMotorista } from "@/lib/validacoes/motorista";
import { criarMotorista, atualizarMotorista } from "@/lib/motoristas-crud";
import type { MotoristaCompleto } from "@/lib/motoristas-crud";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";

type Props = {
  motorista: MotoristaCompleto | null;
  onSucesso: () => void;
  onCancelar: () => void;
};

export function FormMotorista({ motorista, onSucesso, onCancelar }: Props) {
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const editando = motorista !== null;

  const form = useForm<z.input<typeof schemaMotorista>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaMotorista) as any,
    defaultValues: {
      mot_nome: motorista?.mot_nome ?? "",
      mot_cpf: motorista?.mot_cpf ?? "",
    },
  });

  const estaEnviando = form.formState.isSubmitting;

  async function onSubmit(dados: z.input<typeof schemaMotorista>) {
    setErroGeral(null);

    try {
      const resultado = editando
        ? await atualizarMotorista(motorista!.mot_id, dados)
        : await criarMotorista(dados);

      if (!resultado.sucesso) {
        if (resultado.campo) {
          form.setError(resultado.campo as keyof z.input<typeof schemaMotorista>, {
            message: resultado.erro,
          });
        } else {
          setErroGeral(resultado.erro);
        }
        return;
      }

      onSucesso();
    } catch {
      setErroGeral("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {erroGeral && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {erroGeral}
          </div>
        )}

        <FormField
          control={form.control}
          name="mot_nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo do motorista"
                  disabled={estaEnviando}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mot_cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00"
                  disabled={estaEnviando}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={estaEnviando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={estaEnviando}>
            {estaEnviando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editando ? "Salvar" : "Criar motorista"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
