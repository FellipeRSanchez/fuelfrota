import type { Metadata } from "next";
import Link from "next/link";
import { RegistroForm } from "@/components/forms/registro-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Criar conta | FuelFrota",
  description: "Crie sua conta no FuelFrota",
};

export default function PaginaRegistro() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados para se cadastrar no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegistroForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
