"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { FormMotorista } from "@/components/motoristas/form-motorista";
import { desativarMotorista } from "@/lib/motoristas-crud";
import type { MotoristaCompleto } from "@/lib/motoristas-crud";

function formatarCPF(cpf: string | null): string {
  if (!cpf) return "—";
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return cpf;
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function TabelaMotoristas({
  motoristas,
}: {
  motoristas: MotoristaCompleto[];
}) {
  const router = useRouter();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [motoristaEditando, setMotoristaEditando] =
    useState<MotoristaCompleto | null>(null);
  const [desativandoId, setDesativandoId] = useState<number | null>(null);

  function abrirCriar() {
    setMotoristaEditando(null);
    setDialogoAberto(true);
  }

  function abrirEditar(motorista: MotoristaCompleto) {
    setMotoristaEditando(motorista);
    setDialogoAberto(true);
  }

  function aoFecharDialogo() {
    setDialogoAberto(false);
    setMotoristaEditando(null);
  }

  function aoSucesso() {
    aoFecharDialogo();
    router.refresh();
  }

  async function handleDesativar(id: number) {
    if (!confirm("Tem certeza que deseja desativar este motorista?")) return;

    setDesativandoId(id);
    try {
      const resultado = await desativarMotorista(id);
      if (!resultado.sucesso) {
        alert(resultado.erro ?? "Erro ao desativar motorista");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão ao desativar motorista");
    } finally {
      setDesativandoId(null);
    }
  }

  if (motoristas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Users className="h-12 w-12" />
        <p className="text-lg font-medium">Nenhum motorista cadastrado</p>
        <p className="text-sm">
          Clique em &ldquo;Novo motorista&rdquo; para começar.
        </p>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo motorista
        </Button>

        <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {motoristaEditando ? "Editar motorista" : "Novo motorista"}
              </DialogTitle>
              <DialogDescription>
                {motoristaEditando
                  ? "Altere os dados do motorista abaixo."
                  : "Preencha os dados para cadastrar um novo motorista."}
              </DialogDescription>
            </DialogHeader>
            <FormMotorista
              motorista={motoristaEditando}
              onSucesso={aoSucesso}
              onCancelar={aoFecharDialogo}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {motoristas.length} motorista
          {motoristas.length !== 1 ? "s" : ""} ativo
          {motoristas.length !== 1 ? "s" : ""}
        </h2>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo motorista
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motoristas.map((m) => (
              <TableRow key={m.mot_id}>
                <TableCell className="font-medium">{m.mot_nome}</TableCell>
                <TableCell>{formatarCPF(m.mot_cpf)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEditar(m)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDesativar(m.mot_id)}
                      disabled={desativandoId === m.mot_id}
                      title="Desativar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {motoristaEditando ? "Editar motorista" : "Novo motorista"}
            </DialogTitle>
            <DialogDescription>
              {motoristaEditando
                ? "Altere os dados do motorista abaixo."
                : "Preencha os dados para cadastrar um novo motorista."}
            </DialogDescription>
          </DialogHeader>
          <FormMotorista
            motorista={motoristaEditando}
            onSucesso={aoSucesso}
            onCancelar={aoFecharDialogo}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
