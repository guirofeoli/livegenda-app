import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, Calendar, Shield, Check } from "lucide-react";

const PLANOS = [
  {
    nome: "Básico",
    preco: "R$ 49,90",
    recursos: ["Até 50 agendamentos/mês", "1 profissional", "Suporte básico"],
  },
  {
    nome: "Profissional",
    preco: "R$ 99,90",
    recursos: ["Agendamentos ilimitados", "Até 5 profissionais", "Suporte prioritário", "Relatórios avançados"],
    destaque: true,
  },
  {
    nome: "Empresa",
    preco: "R$ 199,90",
    recursos: ["Agendamentos ilimitados", "Profissionais ilimitados", "Suporte VIP 24/7", "API customizada"],
  },
];

export default function PagamentoPlano({ configuracao, onSave, isCollapsible = false }) {
  const [showPlanoModal, setShowPlanoModal] = useState(false);
  const [showCartaoModal, setShowCartaoModal] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  
  const [cartaoData, setCartaoData] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: "",
  });

  const planoAtual = configuracao?.plano_atual || "Básico";
  const proximoCiclo = configuracao?.proximo_ciclo || "2025-12-21";
  const metodoPagamento = configuracao?.metodo_pagamento || {
    tipo: "cartao",
    ultimos_digitos: "1234",
    bandeira: "Visa"
  };

  const handleAlterarPlano = (plano) => {
    setPlanoSelecionado(plano);
    setShowPlanoModal(false);
    onSave({
      ...configuracao,
      plano_atual: plano.nome,
    });
  };

  const handleSalvarCartao = () => {
    onSave({
      ...configuracao,
      metodo_pagamento: {
        tipo: "cartao",
        ultimos_digitos: cartaoData.numero.slice(-4),
        bandeira: "Visa",
      }
    });
    setShowCartaoModal(false);
    setCartaoData({ numero: "", nome: "", validade: "", cvv: "" });
  };

  const formatarData = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const content = (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Plano Atual</h3>
          <Button
            onClick={() => setShowPlanoModal(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            data-testid="button-alterar-plano"
          >
            Alterar Plano
          </Button>
        </div>
        
        <div className="p-6 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className="bg-purple-600 text-white mb-2">Ativo</Badge>
              <h4 className="text-2xl font-bold text-gray-900">{planoAtual}</h4>
              <p className="text-sm text-gray-600 mt-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Próximo ciclo: {formatarData(proximoCiclo)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">
                {PLANOS.find(p => p.nome === planoAtual)?.preco}
              </p>
              <p className="text-sm text-gray-500">por mês</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-purple-100">
            {PLANOS.find(p => p.nome === planoAtual)?.recursos.map((recurso, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-purple-600" />
                {recurso}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Método de Pagamento</h3>
          <Button
            variant="outline"
            onClick={() => setShowCartaoModal(true)}
            className="border-purple-200 hover:bg-purple-50"
            data-testid="button-alterar-cartao"
          >
            Alterar Cartão
          </Button>
        </div>
        
        <div className="p-6 rounded-lg border border-purple-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{metodoPagamento.bandeira} •••• {metodoPagamento.ultimos_digitos}</p>
              <p className="text-sm text-gray-500">Cartão de crédito principal</p>
            </div>
            <Shield className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const modals = (
    <>
      <Dialog open={showPlanoModal} onOpenChange={setShowPlanoModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Escolha seu Plano</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 max-h-[70vh] overflow-y-auto">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`p-6 rounded-xl border-2 transition-all ${
                  plano.destaque
                    ? "border-purple-500 bg-gradient-to-br from-purple-50 to-white shadow-lg"
                    : "border-purple-200 hover:border-purple-400"
                }`}
              >
                {plano.destaque && (
                  <Badge className="bg-purple-600 text-white mb-3">Mais Popular</Badge>
                )}
                <h4 className="text-xl font-bold text-gray-900 mb-2">{plano.nome}</h4>
                <p className="text-3xl font-bold text-purple-600 mb-4">{plano.preco}</p>
                <p className="text-sm text-gray-500 mb-4">por mês</p>
                
                <ul className="space-y-2 mb-6">
                  {plano.recursos.map((recurso, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>{recurso}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleAlterarPlano(plano)}
                  disabled={plano.nome === planoAtual}
                  className={`w-full ${
                    plano.destaque
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                      : "border border-purple-500 text-purple-600 hover:bg-purple-50"
                  }`}
                  variant={plano.destaque ? "default" : "outline"}
                >
                  {plano.nome === planoAtual ? "Plano Atual" : "Selecionar Plano"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCartaoModal} onOpenChange={setShowCartaoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Dados do Cartão</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Cartão *</Label>
              <Input
                id="numero"
                placeholder="0000 0000 0000 0000"
                value={cartaoData.numero}
                onChange={(e) => setCartaoData({ ...cartaoData, numero: e.target.value })}
                className="border-purple-200 focus:border-purple-500"
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome no Cartão *</Label>
              <Input
                id="nome"
                placeholder="Nome como está no cartão"
                value={cartaoData.nome}
                onChange={(e) => setCartaoData({ ...cartaoData, nome: e.target.value })}
                className="border-purple-200 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validade">Validade *</Label>
                <Input
                  id="validade"
                  placeholder="MM/AA"
                  value={cartaoData.validade}
                  onChange={(e) => setCartaoData({ ...cartaoData, validade: e.target.value })}
                  className="border-purple-200 focus:border-purple-500"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cartaoData.cvv}
                  onChange={(e) => setCartaoData({ ...cartaoData, cvv: e.target.value })}
                  className="border-purple-200 focus:border-purple-500"
                  maxLength={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCartaoModal(false)}
              className="border-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarCartao}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              Salvar Cartão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isCollapsible) {
    return (
      <>
        <div className="p-6">{content}</div>
        {modals}
      </>
    );
  }

  return (
    <>
      <Card className="border-purple-100">
        <CardHeader className="border-b border-purple-50">
          <CardTitle className="text-2xl text-gray-900">Pagamento e Plano</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {content}
        </CardContent>
      </Card>
      {modals}
    </>
  );
}
