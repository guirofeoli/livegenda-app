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
import { Loader2, Scissors, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FuncionarioModal({ funcionario, onSave, onClose, isLoading, servicos = [] }) {
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
  
  const [servicoIdsSelecionados, setServicoIdsSelecionados] = useState([]);

  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome_completo: funcionario.nome || funcionario.nome_completo || "",
        telefone: funcionario.telefone || "",
        email: funcionario.email || "",
        cargo: funcionario.cargo || "Atendente",
        status: funcionario.ativo !== false ? "Ativo" : "Inativo",
        foto_url: funcionario.foto || funcionario.foto_url || "",
        data_vinculacao: funcionario.criado_em || funcionario.data_vinculacao || new Date().toISOString().split('T')[0],
        permissoes: funcionario.permissoes || {
          acessar_agenda: false,
          criar_agendamentos: false,
          editar_agendamentos: false,
          visualizar_relatorios: false,
        },
      });
      setServicoIdsSelecionados(funcionario.servico_ids || []);
    } else {
      setServicoIdsSelecionados([]);
    }
  }, [funcionario]);
  
  const handleServicoToggle = (servicoId, checked) => {
    if (checked) {
      setServicoIdsSelecionados(prev => [...prev, servicoId]);
    } else {
      setServicoIdsSelecionados(prev => prev.filter(id => id !== servicoId));
    }
  };
  
  const selecionarTodosServicos = () => {
    setServicoIdsSelecionados(servicos.map(s => s.id));
  };
  
  const limparSelecaoServicos = () => {
    setServicoIdsSelecionados([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      nome: formData.nome_completo,
      servico_ids: servicoIdsSelecionados
    });
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
                    Cargo
                  </Label>
                  <Select
                    value={formData.cargo}
                    onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                  >
                    <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atendente">Atendente</SelectItem>
                      <SelectItem value="Cabeleireiro(a)">Cabeleireiro(a)</SelectItem>
                      <SelectItem value="Manicure">Manicure</SelectItem>
                      <SelectItem value="Esteticista">Esteticista</SelectItem>
                      <SelectItem value="Barbeiro">Barbeiro</SelectItem>
                      <SelectItem value="Maquiador(a)">Maquiador(a)</SelectItem>
                      <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Serviços que atende
                </h3>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={selecionarTodosServicos}
                    className="text-xs text-purple-600 hover:text-purple-700"
                    data-testid="button-selecionar-todos-servicos"
                  >
                    Selecionar todos
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={limparSelecaoServicos}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    data-testid="button-limpar-servicos"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              
              {servicos.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Nenhum serviço cadastrado. Cadastre serviços primeiro para vincular ao funcionário.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-purple-100 rounded-lg bg-purple-50/30">
                  {servicos.map((servico) => (
                    <div 
                      key={servico.id} 
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-100/50 transition-colors"
                    >
                      <Checkbox
                        id={`servico-${servico.id}`}
                        checked={servicoIdsSelecionados.includes(servico.id)}
                        onCheckedChange={(checked) => handleServicoToggle(servico.id, checked)}
                        data-testid={`checkbox-servico-${servico.id}`}
                      />
                      <label 
                        htmlFor={`servico-${servico.id}`} 
                        className="text-sm font-medium text-gray-700 cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{servico.nome}</span>
                        <Badge variant="outline" className="text-xs bg-white">
                          {servico.duracao_minutos}min
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              {servicoIdsSelecionados.length > 0 && (
                <p className="text-xs text-gray-500">
                  {servicoIdsSelecionados.length} serviço(s) selecionado(s)
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Permissões
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acessar_agenda"
                    checked={formData.permissoes.acessar_agenda}
                    onCheckedChange={(checked) => handlePermissionChange("acessar_agenda", checked)}
                  />
                  <label htmlFor="acessar_agenda" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Acessar agenda
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criar_agendamentos"
                    checked={formData.permissoes.criar_agendamentos}
                    onCheckedChange={(checked) => handlePermissionChange("criar_agendamentos", checked)}
                  />
                  <label htmlFor="criar_agendamentos" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Criar agendamentos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editar_agendamentos"
                    checked={formData.permissoes.editar_agendamentos}
                    onCheckedChange={(checked) => handlePermissionChange("editar_agendamentos", checked)}
                  />
                  <label htmlFor="editar_agendamentos" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Editar agendamentos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizar_relatorios"
                    checked={formData.permissoes.visualizar_relatorios}
                    onCheckedChange={(checked) => handlePermissionChange("visualizar_relatorios", checked)}
                  />
                  <label htmlFor="visualizar_relatorios" className="text-sm font-medium text-gray-700 cursor-pointer">
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
