import React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteConfirmModal({ servico, onConfirm, onCancel, isLoading }) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Excluir Serviço
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Nome:</span>
            <span className="text-sm font-semibold text-gray-900">{servico.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duração:</span>
            <span className="text-sm text-gray-900">{servico.duracao_minutos} minutos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Preço:</span>
            <span className="text-sm text-gray-900">R$ {servico.preco?.toFixed(2)}</span>
          </div>
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
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