import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteConfirmModal({ funcionario, onConfirm, onCancel, isLoading }) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Tem certeza que deseja remover este funcionário?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
          <p className="text-sm text-gray-700">
            Você está prestes a remover:
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {funcionario.nome_completo}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {funcionario.cargo} • {funcionario.telefone}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir definitivamente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}