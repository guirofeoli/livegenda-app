
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function FuncionarioModal({ funcionario, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    nome_completo: "",
    telefone: "",
    email: "",
    cargo: "Atendente",
    status: "Ativo",
    foto_url: "",
    data_vinculacao: new Date().toISOString().split('T')[0],
    permissoes: {
      acessar_agenda: false,
      criar_agendamentos: false,
      editar_agendamentos: false,
      visualizar_relatorios: false,
    },
  });

  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome_completo: funcionario.nome_completo || "",
        telefone: funcionario.telefone || "",
        email: funcionario.email || "",
        cargo: funcionario.cargo || "Atendente",
        status: funcionario.status || "Ativo",
        foto_url: funcionario.foto_url || "",
        data_vinculacao: funcionario.data_vinculacao || new Date().toISOString().split('T')[0],
        permissoes: funcionario.permissoes || {
          acessar_agenda: false,
          criar_agendamentos: false,
          editar_agendamentos: false,
          visualizar_relatorios: false,
        },
      });
    }
  }, [funcionario]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, nome: formData.nome_completo });
  };

  const handlePermissionChange = (permission, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permission]: checked,
      },
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}
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
                    placeholder="João da Silva"
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo" className="text-gray-700">
                    Cargo / Função *
                  </Label>
                  <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Atendente">Atendente</SelectItem>
                      <SelectItem value="Profissional">Profissional</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vinculacao" className="text-gray-700">
                    Data de Vinculação
                  </Label>
                  <Input
                    id="data_vinculacao"
                    type="date"
                    value={formData.data_vinculacao}
                    onChange={(e) => setFormData({ ...formData, data_vinculacao: e.target.value })}
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-700">
                    Status *
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Permissões */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Permissões no Sistema
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acessar_agenda"
                    checked={formData.permissoes.acessar_agenda}
                    onCheckedChange={(checked) => handlePermissionChange("acessar_agenda", checked)}
                  />
                  <label
                    htmlFor="acessar_agenda"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Acessar agenda
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criar_agendamentos"
                    checked={formData.permissoes.criar_agendamentos}
                    onCheckedChange={(checked) => handlePermissionChange("criar_agendamentos", checked)}
                  />
                  <label
                    htmlFor="criar_agendamentos"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Criar agendamentos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editar_agendamentos"
                    checked={formData.permissoes.editar_agendamentos}
                    onCheckedChange={(checked) => handlePermissionChange("editar_agendamentos", checked)}
                  />
                  <label
                    htmlFor="editar_agendamentos"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Editar agendamentos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizar_relatorios"
                    checked={formData.permissoes.visualizar_relatorios}
                    onCheckedChange={(checked) => handlePermissionChange("visualizar_relatorios", checked)}
                  />
                  <label
                    htmlFor="visualizar_relatorios"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Visualizar relatórios
                  </label>
                </div>
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
