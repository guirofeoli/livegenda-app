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
import { MapPin, Phone, Mail, Upload, Image as ImageIcon, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LogoUploader } from "@/components/LogoUploader";

const ESTADOS_BR = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

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

export default function InformacoesNegocio({ configuracao, empresaId, onSave, onLogoUpdated, isLoading, isCollapsible = false }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome_negocio: "",
    categoria: "",
    whatsapp: "",
    email: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
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
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepEncontrado, setCepEncontrado] = useState(false);

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setCepEncontrado(false);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado.",
          variant: "destructive"
        });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      setCepEncontrado(true);
      
      toast({
        title: "Endereço encontrado!",
        description: `${data.localidade} - ${data.uf}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setBuscandoCep(false);
    }
  };

  const formatarCep = (value) => {
    const cep = value.replace(/\D/g, '').slice(0, 8);
    if (cep.length > 5) {
      return `${cep.slice(0, 5)}-${cep.slice(5)}`;
    }
    return cep;
  };

  const handleCepChange = (e) => {
    const cepFormatado = formatarCep(e.target.value);
    setFormData({ ...formData, cep: cepFormatado });
    setCepEncontrado(false);
    
    if (cepFormatado.replace(/\D/g, '').length === 8) {
      buscarCep(cepFormatado);
    }
  };

  React.useEffect(() => {
    if (configuracao) {
      setFormData({
        nome_negocio: configuracao.nome_negocio || "",
        categoria: configuracao.categoria || "",
        whatsapp: configuracao.whatsapp || "",
        email: configuracao.email || "",
        logradouro: configuracao.logradouro || "",
        bairro: configuracao.bairro || "",
        cidade: configuracao.cidade || "",
        estado: configuracao.estado || "",
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
      if (configuracao.cidade && configuracao.estado) {
        setCepEncontrado(true);
      }
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

  const handleLogoUpdated = (updatedEmpresa) => {
    if (updatedEmpresa?.logo) {
      setFormData(prev => ({ ...prev, logo_url: updatedEmpresa.logo }));
    }
    onLogoUpdated?.(updatedEmpresa);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          <Label className="text-base font-semibold">Endereço do Estabelecimento</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP *</Label>
            <div className="relative">
              <Input
                id="cep"
                value={formData.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                maxLength={9}
                className={cn(
                  "border-purple-200 focus:border-purple-500 pr-10",
                  cepEncontrado && "border-green-500 bg-green-50"
                )}
                data-testid="input-cep"
              />
              {buscandoCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
              )}
              {cepEncontrado && !buscandoCep && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-xs text-gray-500">Digite o CEP para preenchimento automático</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Nome da cidade"
              className="border-purple-200 focus:border-purple-500"
              required
              data-testid="input-cidade"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => setFormData({ ...formData, estado: value })}
            >
              <SelectTrigger 
                className="border-purple-200 focus:border-purple-500"
                data-testid="select-estado"
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map((est) => (
                  <SelectItem key={est.value} value={est.value}>
                    {est.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="logradouro">Logradouro (rua, avenida, etc.)</Label>
            <Input
              id="logradouro"
              value={formData.logradouro}
              onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
              placeholder="Rua das Flores, 123"
              className="border-purple-200 focus:border-purple-500"
              data-testid="input-logradouro"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Centro"
              className="border-purple-200 focus:border-purple-500"
              data-testid="input-bairro"
            />
          </div>
        </div>
      </div>

      {(!formData.cidade || !formData.estado || !formData.cep) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            <strong>Importante:</strong> Cidade, Estado e CEP são obrigatórios para seu estabelecimento aparecer nas buscas por proximidade.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label>Logo do Negócio</Label>
        <div className="p-4 border border-purple-100 rounded-lg bg-purple-50/30">
          <LogoUploader
            empresaId={empresaId}
            currentLogo={formData.logo_url}
            empresaNome={formData.nome_negocio}
            onUploadComplete={handleLogoUpdated}
            size="lg"
          />
        </div>
      </div>

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

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
          data-testid="button-salvar-configuracoes"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Informações"
          )}
        </Button>
      </div>
    </form>
  );

  if (isCollapsible) {
    return <div className="p-6">{formContent}</div>;
  }

  return (
    <Card className="border-purple-100">
      <CardHeader className="border-b border-purple-50">
        <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" />
          Informações do Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {formContent}
      </CardContent>
    </Card>
  );
}
