import { listarVeiculos } from "@/lib/veiculos-crud";
import { TabelaVeiculos } from "@/components/veiculos/tabela-veiculos";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PaginaVeiculos() {
  const veiculos = await listarVeiculos();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie os veículos da sua frota.
          </p>
        </div>
      </div>

      <TabelaVeiculos veiculos={veiculos} />
    </div>
  );
}
