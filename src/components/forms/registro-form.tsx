"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaRegistro, type DadosRegistro } from "@/lib/validacoes";
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
import { Loader2, UserPlus } from "lucide-react";

type ErroResposta = {
  erro: string;
  detalhes?: unknown;
};

export function RegistroForm() {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<DadosRegistro>({
    resolver: zodResolver(schemaRegistro),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const estaEnviando = form.formState.isSubmitting;

  async function onSubmit(dados: DadosRegistro) {
    setErroGeral(null);

    try {
      const resposta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const corpo: ErroResposta = await resposta.json();

      if (!resposta.ok) {
        setErroGeral(corpo.erro ?? "Erro ao criar conta");
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
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome completo"
                  autoComplete="name"
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
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
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
          name="confirmarSenha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
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
            <UserPlus />
          )}
          Criar conta
        </Button>
      </form>
    </Form>
  );
}
