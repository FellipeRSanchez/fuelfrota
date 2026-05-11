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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Car } from "lucide-react";
import { FormVeiculo } from "@/components/veiculos/form-veiculo";
import { desativarVeiculo } from "@/lib/veiculos-crud";
import type { VeiculoCompleto } from "@/lib/veiculos-crud";

function formatarDecimal(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function TabelaVeiculos({
  veiculos,
}: {
  veiculos: VeiculoCompleto[];
}) {
  const router = useRouter();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] =
    useState<VeiculoCompleto | null>(null);
  const [desativandoId, setDesativandoId] = useState<number | null>(null);

  function abrirCriar() {
    setVeiculoEditando(null);
    setDialogoAberto(true);
  }

  function abrirEditar(veiculo: VeiculoCompleto) {
    setVeiculoEditando(veiculo);
    setDialogoAberto(true);
  }

  function aoFecharDialogo() {
    setDialogoAberto(false);
    setVeiculoEditando(null);
  }

  function aoSucesso() {
    aoFecharDialogo();
    router.refresh();
  }

  async function handleDesativar(id: number) {
    if (!confirm("Tem certeza que deseja desativar este veículo?")) return;

    setDesativandoId(id);
    try {
      const resultado = await desativarVeiculo(id);
      if (!resultado.sucesso) {
        alert(resultado.erro ?? "Erro ao desativar veículo");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão ao desativar veículo");
    } finally {
      setDesativandoId(null);
    }
  }

  if (veiculos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Car className="h-12 w-12" />
        <p className="text-lg font-medium">Nenhum veículo cadastrado</p>
        <p className="text-sm">
          Clique em &ldquo;Novo veículo&rdquo; para começar.
        </p>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo veículo
        </Button>

        <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {veiculoEditando ? "Editar veículo" : "Novo veículo"}
              </DialogTitle>
              <DialogDescription>
                {veiculoEditando
                  ? "Altere os dados do veículo abaixo."
                  : "Preencha os dados para cadastrar um novo veículo."}
              </DialogDescription>
            </DialogHeader>
            <FormVeiculo
              veiculo={veiculoEditando}
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
          {veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""} ativo
          {veiculos.length !== 1 ? "s" : ""}
        </h2>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo veículo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Frota</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Tanque (L)</TableHead>
              <TableHead className="text-right">Consumo (km/L)</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {veiculos.map((v) => (
              <TableRow key={v.vei_id}>
                <TableCell className="font-medium">{v.vei_frota}</TableCell>
                <TableCell>{v.vei_placa}</TableCell>
                <TableCell>
                  {v.vei_tipo ? (
                    <Badge variant="outline">{v.vei_tipo}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatarDecimal(v.vei_capacidade_tanque)}
                </TableCell>
                <TableCell className="text-right">
                  {formatarDecimal(v.vei_consumo_referencia)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEditar(v)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDesativar(v.vei_id)}
                      disabled={desativandoId === v.vei_id}
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
              {veiculoEditando ? "Editar veículo" : "Novo veículo"}
            </DialogTitle>
            <DialogDescription>
              {veiculoEditando
                ? "Altere os dados do veículo abaixo."
                : "Preencha os dados para cadastrar um novo veículo."}
            </DialogDescription>
          </DialogHeader>
          <FormVeiculo
            veiculo={veiculoEditando}
            onSucesso={aoSucesso}
            onCancelar={aoFecharDialogo}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
