import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Scissors, 
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2
} from "lucide-react";
import { EmpresaLogo } from "@/components/LogoUploader";

// Mapeamento de ícones para categorias
const ICONES_CATEGORIAS = {
  'scissors': Scissors,
  'sparkles': Sparkles,
  'building': Building2
};

const RAIOS = [
  { value: '5', label: 'Até 5 km' },
  { value: '10', label: 'Até 10 km' },
  { value: '25', label: 'Até 25 km' },
  { value: '50', label: 'Até 50 km' },
  { value: '100', label: 'Até 100 km' }
];

export default function BuscarServicos() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [raioKm, setRaioKm] = useState("25");
  const [localizacao, setLocalizacao] = useState(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [categorias, setCategorias] = useState([]);

  // Buscar categorias da API
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/public/categorias');
        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    fetchCategorias();
  }, []);

  // Buscar localização do usuário ao carregar
  useEffect(() => {
    obterLocalizacao();
  }, []);

  // Buscar empresas quando localização ou filtros mudam
  useEffect(() => {
    if (localizacao || buscaRealizada) {
      buscarEmpresas();
    }
  }, [localizacao, categoria, raioKm]);

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      setErroLocalizacao("Seu navegador não suporta geolocalização");
      return;
    }

    setBuscandoLocalizacao(true);
    setErroLocalizacao(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalizacao({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setBuscandoLocalizacao(false);
      },
      (error) => {
        setBuscandoLocalizacao(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErroLocalizacao("Permissão de localização negada. Ative nas configurações do navegador.");
            break;
          case error.POSITION_UNAVAILABLE:
            setErroLocalizacao("Localização indisponível no momento.");
            break;
          case error.TIMEOUT:
            setErroLocalizacao("Tempo esgotado ao obter localização.");
            break;
          default:
            setErroLocalizacao("Erro ao obter localização.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache por 5 minutos
      }
    );
  };

  const buscarEmpresas = async () => {
    setCarregando(true);
    setBuscaRealizada(true);

    try {
      const params = new URLSearchParams();
      
      if (localizacao) {
        params.append('lat', localizacao.lat.toString());
        params.append('lng', localizacao.lng.toString());
      }
      
      if (categoria && categoria !== 'todas') {
        params.append('categoria', categoria);
      }
      
      params.append('raio_km', raioKm);
      
      if (termo.trim()) {
        params.append('termo', termo.trim());
      }

      const response = await fetch(`/api/public/buscar-servicos?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEmpresas(data.empresas || []);
      } else {
        console.error("Erro na busca:", data.error);
        setEmpresas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setEmpresas([]);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    buscarEmpresas();
  };

  const formatarCategoria = (cat) => {
    const categoriaObj = categorias.find(c => c.value === cat);
    return categoriaObj?.label || cat?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || cat;
  };

  const formatarPreco = (preco) => {
    if (!preco) return 'Consultar';
    return `R$ ${parseFloat(preco).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" data-testid="link-logo">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Livegenda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Encontre serviços perto de você
          </h1>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Descubra profissionais e estabelecimentos próximos e agende online em segundos
          </p>
        </div>
      </section>

      {/* Formulário de Busca */}
      <section className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <Card className="shadow-xl border-purple-100">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Linha principal */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    placeholder="O que você procura? (corte, manicure, barba...)"
                    className="pl-10 h-12"
                    data-testid="input-termo-busca"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 h-12 px-8"
                  disabled={carregando}
                  data-testid="button-buscar"
                >
                  {carregando ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">
                        Todas as categorias
                      </SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={raioKm} onValueChange={setRaioKm}>
                    <SelectTrigger data-testid="select-raio">
                      <SelectValue placeholder="Distância" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAIOS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="button" 
                  variant="outline"
                  onClick={obterLocalizacao}
                  disabled={buscandoLocalizacao}
                  className="gap-2"
                  data-testid="button-localizacao"
                >
                  {buscandoLocalizacao ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : localizacao ? (
                    <MapPin className="w-4 h-4 text-green-600" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {localizacao ? "Localizado" : "Usar minha localização"}
                </Button>
              </div>

              {/* Aviso de localização */}
              {erroLocalizacao && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{erroLocalizacao}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Resultados */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {carregando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : buscaRealizada && empresas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Tente ajustar os filtros ou aumentar o raio de busca para encontrar mais opções
            </p>
          </div>
        ) : empresas.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {empresas.length} {empresas.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}
              </h2>
              {localizacao && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  Ordenado por distância
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map((empresa) => (
                <Card 
                  key={empresa.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/empresa/${empresa.slug}`)}
                  data-testid={`card-empresa-${empresa.id}`}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <EmpresaLogo 
                        logo={empresa.logo} 
                        nome={empresa.nome} 
                        size="lg"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                            {empresa.nome}
                          </h3>
                          {empresa.distancia_km !== null && (
                            <Badge className="bg-purple-100 text-purple-700 ml-2 flex-shrink-0">
                              {empresa.distancia_km} km
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {formatarCategoria(empresa.categoria)}
                        </Badge>
                      </div>
                    </div>

                    {/* Endereço */}
                    {(empresa.bairro || empresa.cidade) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {[empresa.bairro, empresa.cidade].filter(Boolean).join(', ')}
                          {empresa.estado && ` - ${empresa.estado}`}
                        </span>
                      </div>
                    )}

                    {/* Serviços */}
                    {empresa.servicos && empresa.servicos.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-gray-700">Serviços:</p>
                        <div className="flex flex-wrap gap-2">
                          {empresa.servicos.slice(0, 3).map((servico) => (
                            <div 
                              key={servico.id}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {servico.nome} • {formatarPreco(servico.preco)}
                            </div>
                          ))}
                          {empresa.servicos.length > 3 && (
                            <div className="text-xs text-purple-600 px-2 py-1">
                              +{empresa.servicos.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {empresa.horario_abertura || '08:00'} - {empresa.horario_fechamento || '18:00'}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-purple-600 hover:text-purple-700 gap-1"
                      >
                        Agendar
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : !buscaRealizada && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Pronto para buscar?
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {localizacao 
                ? "Clique em buscar para encontrar estabelecimentos próximos a você"
                : "Ative sua localização para encontrar os melhores serviços perto de você"
              }
            </p>
            {!localizacao && !buscandoLocalizacao && (
              <Button onClick={obterLocalizacao} className="gap-2">
                <Navigation className="w-4 h-4" />
                Ativar localização
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Livegenda - Sistema de agendamento online
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Encontre e agende serviços de beleza na sua região
          </p>
        </div>
      </footer>
    </div>
  );
}
