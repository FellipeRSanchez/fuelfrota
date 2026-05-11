import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar | FuelFrota",
  description: "Acesse sua conta do FuelFrota",
};

export default function PaginaLogin() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">FuelFrota</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link
            href="/registrar"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
