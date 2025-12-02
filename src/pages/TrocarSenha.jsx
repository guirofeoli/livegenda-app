import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function TrocarSenha() {
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validações
    if (formData.novaSenha.length < 6) {
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      return;
    }

    // Buscar usuário atual
    const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    
    const usuarioIndex = usuarios.findIndex(u => u.id === currentUser.id);
    
    if (usuarioIndex === -1) {
      return;
    }

    // Verificar senha atual
    if (usuarios[usuarioIndex].senha !== formData.senhaAtual) {
      return;
    }

    // Atualizar senha
    usuarios[usuarioIndex].senha = formData.novaSenha;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    
    // Limpar formulário
    setFormData({
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Trocar Senha
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Altere sua senha de acesso ao sistema
        </p>
      </div>

      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="senhaAtual"
                  name="senhaAtual"
                  type={showSenhaAtual ? "text" : "password"}
                  value={formData.senhaAtual}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  name="novaSenha"
                  type={showNovaSenha ? "text" : "password"}
                  value={formData.novaSenha}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                A senha deve ter no mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={showConfirmarSenha ? "text" : "password"}
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })}
                className="border-purple-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Alterar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-purple-100 mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">
            Dicas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              Use uma senha forte com letras, números e caracteres especiais
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              Não compartilhe sua senha com outras pessoas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              Troque sua senha regularmente para maior segurança
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              Evite usar a mesma senha em diferentes sistemas
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
