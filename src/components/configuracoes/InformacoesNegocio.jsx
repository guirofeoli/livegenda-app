import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Phone, Mail, Upload, Image as ImageIcon, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DIAS_SEMANA = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const CATEGORIAS_EMPRESA = [
  { value: 'salao_beleza', label: 'Salão de Beleza' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'clinica_estetica', label: 'Clínica de Estética' },
  { value: 'spa', label: 'SPA' },
  { value: 'studio_unhas', label: 'Studio de Unhas' },
  { value: 'sobrancelhas', label: 'Design de Sobrancelhas' },
  { value: 'makeup', label: 'Maquiagem' },
  { value: 'massagem', label: 'Massagem' },
  { value: 'outro', label: 'Outro' }
];

export default function InformacoesNegocio({ configuracao, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    nome_negocio: "",
    categoria: "",
    whatsapp: "",
    email: "",
    endereco: "",
    cep: "",
    logo_url: "",
    horario_funcionamento: {
      segunda: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      terca: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      quarta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      quinta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      sexta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      sabado: { ativo: true, abertura: "09:00", fechamento: "14:00" },
      domingo: { ativo: false, abertura: "09:00", fechamento: "18:00" },
    }
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Atualizar formData quando configuracao mudar
  React.useEffect(() => {
    if (configuracao) {
      setFormData({
        nome_negocio: configuracao.nome_negocio || "",
        categoria: configuracao.categoria || "",
        whatsapp: configuracao.whatsapp || "",
        email: configuracao.email || "",
        endereco: configuracao.endereco || "",
        cep: configuracao.cep || "",
        logo_url: configuracao.logo_url || "",
        horario_funcionamento: configuracao.horario_funcionamento || {
          segunda: { ativo: true, abertura: "09:00", fechamento: "18:00" },
          terca: { ativo: true, abertura: "09:00", fechamento: "18:00" },
          quarta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
          quinta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
          sexta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
          sabado: { ativo: true, abertura: "09:00", fechamento: "14:00" },
          domingo: { ativo: false, abertura: "09:00", fechamento: "18:00" },
        }
      });
    }
  }, [configuracao]);

  const handleHorarioChange = (dia, field, value) => {
    setFormData({
      ...formData,
      horario_funcionamento: {
        ...formData.horario_funcionamento,
        [dia]: {
          ...formData.horario_funcionamento[dia],
          [field]: value,
        }
      }
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="border-purple-100">
      <CardHeader className="border-b border-purple-50">
        <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" />
          Informações do Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome_negocio">Nome do Negócio *</Label>
              <Input
                id="nome_negocio"
                value={formData.nome_negocio}
                onChange={(e) => setFormData({ ...formData, nome_negocio: e.target.value })}
                placeholder="Ex: Studio de Beleza Maria"
                className="border-purple-200 focus:border-purple-500"
                required
                data-testid="input-nome-negocio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger 
                  className="border-purple-200 focus:border-purple-500"
                  data-testid="select-categoria"
                >
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_EMPRESA.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="pl-10 border-purple-200 focus:border-purple-500"
                  data-testid="input-whatsapp"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@seunegocio.com"
                  className="pl-10 border-purple-200 focus:border-purple-500"
                  data-testid="input-email"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  className="pl-10 border-purple-200 focus:border-purple-500"
                  data-testid="input-endereco"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="00000-000"
                className="border-purple-200 focus:border-purple-500"
                data-testid="input-cep"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <Label>Logo do Negócio</Label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {formData.logo_url ? (
                  <div className="w-24 h-24 rounded-lg border-2 border-purple-200 overflow-hidden">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-purple-200 flex items-center justify-center bg-purple-50">
                    <ImageIcon className="w-8 h-8 text-purple-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors w-fit">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600">
                      {uploadingLogo ? 'Enviando...' : 'Escolher imagem'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos: JPG, PNG. Tamanho máximo: 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Horário de Funcionamento</Label>
            <div className="space-y-3">
              {DIAS_SEMANA.map((dia) => {
                const horario = formData.horario_funcionamento[dia.key];
                return (
                  <div 
                    key={dia.key} 
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-2 border-b border-purple-50 last:border-0"
                  >
                    <div className="flex items-center justify-between md:w-48">
                      <span className="font-medium text-gray-700">{dia.label}</span>
                      <Switch
                        checked={horario.ativo}
                        onCheckedChange={(checked) => handleHorarioChange(dia.key, 'ativo', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    
                    {horario.ativo && (
                      <div className="flex items-center gap-2 md:gap-3 flex-1">
                        <Input
                          type="time"
                          value={horario.abertura}
                          onChange={(e) => handleHorarioChange(dia.key, 'abertura', e.target.value)}
                          className="flex-1 md:w-32 border-purple-200 focus:border-purple-500"
                        />
                        <span className="text-gray-500 text-sm">até</span>
                        <Input
                          type="time"
                          value={horario.fechamento}
                          onChange={(e) => handleHorarioChange(dia.key, 'fechamento', e.target.value)}
                          className="flex-1 md:w-32 border-purple-200 focus:border-purple-500"
                        />
                      </div>
                    )}
                    
                    {!horario.ativo && (
                      <span className="text-sm text-gray-500 italic">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
              data-testid="button-salvar-configuracoes"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                "Salvar Informações"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
