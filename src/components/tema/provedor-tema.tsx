"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Tema = "claro" | "escuro";

type ContextoTema = {
  tema: Tema;
  alternarTema: () => void;
};

const TemaContext = createContext<ContextoTema | undefined>(undefined);

const CHAVE_TEMA = "fuelfrota-tema";

function obterTemaInicial(): Tema {
  if (typeof window === "undefined") return "claro";

  const salvo = localStorage.getItem(CHAVE_TEMA);
  if (salvo === "escuro" || salvo === "claro") return salvo;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("claro");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setTema(obterTemaInicial());
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!montado) return;

    const raiz = document.documentElement;
    raiz.classList.toggle("dark", tema === "escuro");
    localStorage.setItem(CHAVE_TEMA, tema);
  }, [tema, montado]);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === "claro" ? "escuro" : "claro"));
  }, []);

  // Evita flash de tema incorreto antes da hidratação
  if (!montado) {
    return (
      <TemaContext.Provider value={{ tema: "claro", alternarTema }}>
        {children}
      </TemaContext.Provider>
    );
  }

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema(): ContextoTema {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error("useTema deve ser usado dentro de ProvedorTema");
  }
  return ctx;
}
