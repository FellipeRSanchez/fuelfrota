"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function BotaoSair() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    setSaindo(true);
    try {
      await fetch("/api/auth/sessao", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      setSaindo(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSair}
      disabled={saindo}
    >
      {saindo ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sair
    </Button>
  );
}
