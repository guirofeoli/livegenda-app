
import React, { useState, useEffect } from "react";
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

export default function ClienteModal({ cliente, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    nome_completo: "",
    telefone: "",
    email: "",
    observacoes: "",
    foto_url: "",
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome_completo: cliente.nome_completo || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        observacoes: cliente.observacoes || "",
        foto_url: cliente.foto_url || "",
      });
    }
  }, [cliente]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {cliente ? "Editar Cliente" : "Adicionar Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo" className="text-gray-700">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    placeholder="Maria Silva"
                    required
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-gray-700">
                    Telefone / WhatsApp *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    required
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="maria@exemplo.com"
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Observações
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-gray-700">
                  Observações sobre a cliente
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Escreva observações relevantes sobre a cliente..."
                  rows={4}
                  className="border-purple-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-purple-200 hover:bg-purple-50 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
