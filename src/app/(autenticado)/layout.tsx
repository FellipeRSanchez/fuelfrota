import { obterSessao } from "@/lib/auth-nativo";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BotaoSair } from "@/components/painel/botao-sair";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { BarChart3, Car, Fuel, Users } from "lucide-react";

const links = [
  { href: "/painel", label: "Painel", icone: BarChart3 },
  { href: "/veiculos", label: "Veículos", icone: Car },
  { href: "/motoristas", label: "Motoristas", icone: Users },
  { href: "/abastecimento", label: "Abastecimento", icone: Fuel },
  { href: "/relatorios", label: "Relatórios", icone: BarChart3 },
];

export default async function LayoutAutenticado({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await obterSessao();

  if (!sessao) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/painel" className="font-semibold hover:opacity-80">
            Controle Combustível
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icone = link.icone;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <Icone className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlternarTema />
          <span>{sessao.nome}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">
            {sessao.role}
          </span>
          <BotaoSair />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
