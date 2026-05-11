import { listarMotoristas } from "@/lib/motoristas-crud";
import { TabelaMotoristas } from "@/components/motoristas/tabela-motoristas";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PaginaMotoristas() {
  const motoristas = await listarMotoristas();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motoristas</h1>
          <p className="text-muted-foreground">
            Gerencie os motoristas da sua frota.
          </p>
        </div>
      </div>

      <TabelaMotoristas motoristas={motoristas} />
    </div>
  );
}
