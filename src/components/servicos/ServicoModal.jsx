import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function ServicoModal({ servico, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    duracao_minutos: "",
    preco: "",
  });

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome || "",
        descricao: servico.descricao || "",
        duracao_minutos: servico.duracao_minutos || "",
        preco: servico.preco || "",
      });
    }
  }, [servico]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      duracao_minutos: Number(formData.duracao_minutos),
      preco: Number(formData.preco),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {servico ? "Editar Serviço" : "Adicionar Serviço"}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Corte de Cabelo"
              required
              className="border-purple-200 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o serviço..."
              rows={3}
              className="border-purple-200 focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos) *</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                placeholder="60"
                required
                min="1"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="50.00"
                required
                min="0"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Serviço"
              )}
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}