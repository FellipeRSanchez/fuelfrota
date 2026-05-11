import { listarAbastecimentos } from "@/lib/abastecimentos-crud";
import { listarVeiculos } from "@/lib/veiculos-crud";
import { listarMotoristas } from "@/lib/motoristas-crud";
import { TabelaAbastecimentos } from "@/components/abastecimentos/tabela-abastecimentos";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PaginaAbastecimentos() {
  const [dados, veiculos, motoristas] = await Promise.all([
    listarAbastecimentos({ page: 1, limit: 10 }),
    listarVeiculos(),
    listarMotoristas(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abastecimentos</h1>
          <p className="text-muted-foreground">
            Histórico de abastecimentos da frota.
          </p>
        </div>
      </div>

      <TabelaAbastecimentos
        dadosIniciais={dados}
        veiculos={veiculos}
        motoristas={motoristas}
      />
    </div>
  );
}
