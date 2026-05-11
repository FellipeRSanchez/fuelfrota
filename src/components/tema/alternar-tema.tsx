"use client";

import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTema } from "@/components/tema/provedor-tema";

export function AlternarTema() {
  const { tema, alternarTema } = useTema();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternarTema}
      aria-label={tema === "claro" ? "Ativar tema escuro" : "Ativar tema claro"}
      className="h-9 w-9"
    >
      {tema === "claro" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
