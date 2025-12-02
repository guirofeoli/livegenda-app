import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Link2, Copy, ExternalLink, Share2, Check, Pencil, Save, X, Loader2 } from "lucide-react";

export default function LinkAgendamento({ empresaSlug, empresaNome, empresaId, onSlugUpdate, isCollapsible = false }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editando, setEditando] = useState(false);
  const [novoSlug, setNovoSlug] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://app.livegenda.com';
  
  const linkAgendamento = empresaSlug 
    ? `${baseUrl}/empresa/${empresaSlug}`
    : null;

  useEffect(() => {
    if (empresaSlug) {
      setNovoSlug(empresaSlug);
    }
  }, [empresaSlug]);

  const formatarSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  };

  const handleSlugChange = (e) => {
    const valor = e.target.value;
    const slugFormatado = formatarSlug(valor);
    setNovoSlug(slugFormatado);
    setErro("");
  };

  const handleSalvarSlug = async () => {
    if (!novoSlug || novoSlug.length < 3) {
      setErro("O identificador deve ter no mínimo 3 caracteres");
      return;
    }

    if (novoSlug === empresaSlug) {
      setEditando(false);
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const response = await fetch(`/api/empresas/${empresaId}/slug`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: novoSlug })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErro("Este identificador já está em uso. Escolha outro.");
        } else {
          setErro(data.error || "Erro ao salvar");
        }
        return;
      }

      toast({
        title: "URL atualizada!",
        description: "O link de agendamento foi personalizado com sucesso.",
      });

      if (onSlugUpdate) {
        onSlugUpdate(novoSlug);
      }

      const empresaStr = localStorage.getItem('livegenda_empresa');
      if (empresaStr) {
        const empresa = JSON.parse(empresaStr);
        empresa.slug = novoSlug;
        localStorage.setItem('livegenda_empresa', JSON.stringify(empresa));
      }

      setEditando(false);
    } catch (err) {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setNovoSlug(empresaSlug || "");
    setErro("");
    setEditando(false);
  };

  const handleCopy = async () => {
    if (!linkAgendamento) return;
    
    try {
      await navigator.clipboard.writeText(linkAgendamento);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!linkAgendamento) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agende com ${empresaNome || 'nossa empresa'}`,
          text: 'Faça seu agendamento online de forma rápida e fácil!',
          url: linkAgendamento
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleOpenLink = () => {
    if (linkAgendamento) {
      window.open(linkAgendamento, '_blank');
    }
  };

  const renderContent = () => {
    if (!empresaSlug && !editando) {
      return (
        <div className="space-y-4 p-6">
          <p className="text-sm text-orange-700">
            Configure o identificador único da sua página de agendamento online.
          </p>
          <Button
            onClick={() => setEditando(true)}
            className="gap-2"
            data-testid="button-configurar-slug"
          >
            <Pencil className="w-4 h-4" />
            Configurar URL
          </Button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-gray-600">
            Compartilhe este link com seus clientes para que eles possam agendar serviços diretamente pela internet.
          </p>
          {empresaSlug && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Ativo
            </Badge>
          )}
        </div>

        {editando ? (
          <div className="space-y-3">
            <Label htmlFor="slug-input" className="text-sm font-medium">
              Personalize sua URL (máx. 50 caracteres)
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1 bg-gray-100 rounded-md border">
                  <span className="text-sm text-gray-500 pl-3 whitespace-nowrap">
                    {baseUrl}/empresa/
                  </span>
                  <Input
                    id="slug-input"
                    value={novoSlug}
                    onChange={handleSlugChange}
                    placeholder="seu-negocio"
                    className="border-0 bg-transparent focus-visible:ring-0 px-1"
                    maxLength={50}
                    data-testid="input-slug-personalizado"
                  />
                </div>
                {erro && (
                  <p className="text-sm text-red-600 mt-1">{erro}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Use apenas letras minúsculas, números e hífens. Ex: meu-salao, barbearia-do-joao
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCancelar}
                  disabled={salvando}
                  data-testid="button-cancelar-slug"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSalvarSlug}
                  disabled={salvando || !novoSlug}
                  data-testid="button-salvar-slug"
                >
                  {salvando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={linkAgendamento}
                readOnly
                className="bg-gray-50 font-mono text-sm"
                data-testid="input-link-agendamento"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
                data-testid="button-copiar-link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditando(true)}
                className="gap-2"
                data-testid="button-editar-slug"
              >
                <Pencil className="w-4 h-4" />
                Personalizar URL
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="gap-2"
                data-testid="button-abrir-link"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir página
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
                data-testid="button-compartilhar-link"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-purple-900 mb-2">Dicas de uso:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>- Adicione este link na bio do seu Instagram</li>
            <li>- Envie por WhatsApp para seus clientes</li>
            <li>- Coloque no seu cartão de visitas</li>
            <li>- Use nas suas redes sociais</li>
          </ul>
        </div>
      </div>
    );
  };

  if (isCollapsible) {
    return renderContent();
  }

  if (!empresaSlug && !editando) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-orange-700">
            Configure o identificador único da sua página de agendamento online.
          </p>
          <Button
            onClick={() => setEditando(true)}
            className="gap-2"
            data-testid="button-configurar-slug"
          >
            <Pencil className="w-4 h-4" />
            Configurar URL
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-100">
      <CardHeader className="border-b border-purple-50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-600" />
            Link de Agendamento Online
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Ativo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
