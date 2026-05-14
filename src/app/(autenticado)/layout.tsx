import { obterSessao } from "@/lib/auth-nativo";
import { redirect } from "next/navigation";
import LayoutCliente from "./layout-client";

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
    <LayoutCliente sessao={{ nome: sessao.nome, role: sessao.role }}>
      {children}
    </LayoutCliente>
  );
}