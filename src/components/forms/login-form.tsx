"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaEntrar, type DadosEntrar } from "@/lib/validacoes";
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
import { Loader2, LogIn } from "lucide-react";

type ErroResposta = {
  erro: string;
  detalhes?: unknown;
};

export function LoginForm() {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<DadosEntrar>({
    resolver: zodResolver(schemaEntrar),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const estaEnviando = form.formState.isSubmitting;

  async function onSubmit(dados: DadosEntrar) {
    setErroGeral(null);

    try {
      const resposta = await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const corpo: ErroResposta = await resposta.json();

      if (!resposta.ok) {
        setErroGeral(corpo.erro ?? "Erro ao entrar");
        return;
      }

      router.push("/");
      router.refresh();
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
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
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={estaEnviando}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={estaEnviando}>
          {estaEnviando ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Entrar
        </Button>
      </form>
    </Form>
  );
}
