"use client";

import Link from "next/link";
import { BotaoSair } from "@/components/painel/botao-sair";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { BarChart3, Car, Fuel, Users, Menu } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/painel", label: "Painel", icone: BarChart3 },
  { href: "/abastecimento", label: "Abastecimento", icone: Fuel },
  { href: "/veiculos", label: "Veículos", icone: Car },
  { href: "/motoristas", label: "Motoristas", icone: Users },
  { href: "/relatorios", label: "Relatórios", icone: BarChart3 },
];

interface LayoutClienteProps {
  sessao: {
    nome: string;
    role: string;
  } | null;
  children: React.ReactNode;
}

export default function LayoutCliente({
  sessao,
  children,
}: LayoutClienteProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
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
          {sessao && (
            <>
              <span>{sessao.nome}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {sessao.role}
              </span>
            </>
          )}
          <BotaoSair />
        </div>
      </header>
      {isMobileMenuOpen && (
        <nav className="fixed inset-0 z-50 flex flex-col items-center p-4 bg-white dark:bg-gray-800 shadow-md md:hidden">
          {links.map((link) => {
            const Icone = link.icone;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icone className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}