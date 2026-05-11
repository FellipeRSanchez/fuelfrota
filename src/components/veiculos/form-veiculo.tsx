"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schemaVeiculo } from "@/lib/validacoes/veiculo";
import { criarVeiculo, atualizarVeiculo } from "@/lib/veiculos-crud";
import type { VeiculoCompleto } from "@/lib/veiculos-crud";
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

type FormValues = z.input<typeof schemaVeiculo>;

type Props = {
  veiculo: VeiculoCompleto | null;
  onSucesso: () => void;
  onCancelar: () => void;
};

export function FormVeiculo({ veiculo, onSucesso, onCancelar }: Props) {
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const editando = veiculo !== null;

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaVeiculo) as any,
    defaultValues: {
      vei_frota: veiculo?.vei_frota ?? "",
      vei_placa: veiculo?.vei_placa ?? "",
      vei_tipo: veiculo?.vei_tipo ?? "",
      vei_capacidade_tanque: veiculo
        ? String(veiculo.vei_capacidade_tanque)
        : "",
      vei_consumo_referencia: veiculo
        ? String(veiculo.vei_consumo_referencia)
        : "",
    },
  });

  const estaEnviando = form.formState.isSubmitting;

  async function onSubmit(dados: FormValues) {
    setErroGeral(null);

    try {
      const resultado = editando
        ? await atualizarVeiculo(veiculo!.vei_id, dados)
        : await criarVeiculo(dados);

      if (!resultado.sucesso) {
        if (resultado.campo) {
          form.setError(resultado.campo as keyof FormValues, {
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vei_frota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frota</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: FR001"
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
            name="vei_placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: ABC-1234"
                    disabled={estaEnviando}
                    className="uppercase"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vei_tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Caminhão, Carreta, Bitrem"
                  disabled={estaEnviando}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vei_capacidade_tanque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade do tanque (L)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 600"
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
            name="vei_consumo_referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consumo referência (km/L)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2.5"
                    disabled={estaEnviando}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {editando ? "Salvar" : "Criar veículo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
