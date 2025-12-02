import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { resolveObjectUrl } from '@/components/LogoUploader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  MapPin,
  CalendarPlus,
  ArrowLeft,
  Filter,
  Navigation,
  ArrowDown,
  Search,
  CalendarCheck,
  X,
  RefreshCw,
  XCircle,
  Edit3,
  Loader2,
  LogIn
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = '/api';

const formatarData = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
};

const formatarDataCurta = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(date);
};

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const DIAS_ABREVIADOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const verificarDiaAberto = (empresa, diaSemanaIndex) => {
  if (!empresa) return false;
  
  const diasFuncionamento = empresa.dias_funcionamento;
  
  if (Array.isArray(diasFuncionamento)) {
    const diaAbreviado = DIAS_ABREVIADOS[diaSemanaIndex];
    return diasFuncionamento.includes(diaAbreviado);
  }
  
  if (diasFuncionamento && typeof diasFuncionamento === 'object') {
    const diaNome = DIAS_SEMANA[diaSemanaIndex];
    return diasFuncionamento[diaNome]?.ativo !== false;
  }
  
  return diaSemanaIndex >= 1 && diaSemanaIndex <= 5;
};

const getHorarioFuncionamento = (empresa, diaSemanaIndex) => {
  if (!empresa) return null;
  
  const diasFuncionamento = empresa.dias_funcionamento;
  
  if (Array.isArray(diasFuncionamento)) {
    const diaAbreviado = DIAS_ABREVIADOS[diaSemanaIndex];
    if (!diasFuncionamento.includes(diaAbreviado)) return null;
    return {
      ativo: true,
      inicio: empresa.horario_abertura || '09:00',
      fim: empresa.horario_fechamento || '18:00'
    };
  }
  
  if (diasFuncionamento && typeof diasFuncionamento === 'object') {
    const diaNome = DIAS_SEMANA[diaSemanaIndex];
    return diasFuncionamento[diaNome];
  }
  
  return null;
};

const getInicioSemana = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export default function EmpresaPublica() {
  const { slug } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  
  const [modoAgendamento, setModoAgendamento] = useState(false);
  const [step, setStep] = useState(1);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date());
  
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [clienteExistente, setClienteExistente] = useState(null);
  const [verificandoCliente, setVerificandoCliente] = useState(false);
  const [clienteVerificado, setClienteVerificado] = useState(false);
  
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agendamentoCriado, setAgendamentoCriado] = useState(null);
  
  const [semanaAtual, setSemanaAtual] = useState(getInicioSemana(new Date()));
  const [agendamentosSemana, setAgendamentosSemana] = useState([]);
  const [loadingSemana, setLoadingSemana] = useState(false);
  const [filtroFuncionarioId, setFiltroFuncionarioId] = useState(null);
  
  // Estados para consulta de agendamentos do cliente
  const [showMeusAgendamentos, setShowMeusAgendamentos] = useState(false);
  const [emailConsulta, setEmailConsulta] = useState('');
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [loadingMeusAgendamentos, setLoadingMeusAgendamentos] = useState(false);
  const [clienteConsulta, setClienteConsulta] = useState(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [showCancelarDialog, setShowCancelarDialog] = useState(false);
  const [showRemarcarDialog, setShowRemarcarDialog] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [remarcando, setRemarcando] = useState(false);
  const [novaDataRemarcar, setNovaDataRemarcar] = useState('');
  const [novaHoraRemarcar, setNovaHoraRemarcar] = useState('');
  const [horariosRemarcar, setHorariosRemarcar] = useState([]);
  const [loadingHorariosRemarcar, setLoadingHorariosRemarcar] = useState(false);
  
  // Estados para verificação de email com OTP
  const [etapaVerificacao, setEtapaVerificacao] = useState('email'); // 'email', 'codigo', 'verificado'
  const [tokenVerificacao, setTokenVerificacao] = useState('');
  const [tokenAcesso, setTokenAcesso] = useState('');
  const [codigoOTP, setCodigoOTP] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  useEffect(() => {
    if (slug) {
      carregarDados();
    }
  }, [slug]);

  useEffect(() => {
    if (empresa && !modoAgendamento) {
      carregarAgendamentosSemana();
    }
  }, [empresa, semanaAtual, modoAgendamento, filtroFuncionarioId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/public/empresas/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Empresa não encontrada');
        } else {
          setError('Erro ao carregar dados');
        }
        return;
      }
      const data = await response.json();
      setEmpresa(data.empresa);
      setFuncionarios(data.funcionarios || []);
      setServicos(data.servicos || []);
      setVinculos(data.vinculos || []);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const carregarAgendamentosSemana = async () => {
    if (!empresa) return;
    
    try {
      setLoadingSemana(true);
      
      // Calcular datas de início e fim da semana
      const inicioSemana = new Date(semanaAtual);
      const fimSemana = new Date(semanaAtual);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      const inicioStr = inicioSemana.toISOString().split('T')[0];
      const fimStr = fimSemana.toISOString().split('T')[0];
      
      // Uma única requisição para toda a semana
      const url = filtroFuncionarioId
        ? `${API_BASE}/public/agenda-semana/${slug}?inicio=${inicioStr}&fim=${fimStr}&funcionario_id=${filtroFuncionarioId}`
        : `${API_BASE}/public/agenda-semana/${slug}?inicio=${inicioStr}&fim=${fimStr}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        const agendamentosFormatados = (result.agendamentos || []).map(ag => ({
          data: new Date(ag.inicio).toISOString().split('T')[0],
          funcionarioId: ag.funcionario_id,
          inicio: new Date(ag.inicio),
          fim: new Date(ag.fim)
        }));
        setAgendamentosSemana(agendamentosFormatados);
      } else {
        setAgendamentosSemana([]);
      }
    } catch (err) {
      console.error('Erro ao carregar semana:', err);
      setAgendamentosSemana([]);
    } finally {
      setLoadingSemana(false);
    }
  };

  const funcionariosParaServico = useMemo(() => {
    if (!servicoSelecionado) return funcionarios;
    const vinculosServico = vinculos.filter(v => v.servico_id === servicoSelecionado.id);
    if (vinculosServico.length === 0) return funcionarios;
    return funcionarios.filter(f => vinculosServico.some(v => v.funcionario_id === f.id));
  }, [servicoSelecionado, funcionarios, vinculos]);

  const [agendaData, setAgendaData] = useState(null);
  
  const carregarHorarios = async (data) => {
    if (!funcionarioSelecionado || !data) return;
    
    try {
      setLoadingHorarios(true);
      const dataStr = data.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/public/agenda/${slug}/${funcionarioSelecionado.id}/${dataStr}`);
      if (response.ok) {
        const result = await response.json();
        setAgendaData(result);
        setHorariosOcupados(result.horarios_ocupados || []);
      }
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
    } finally {
      setLoadingHorarios(false);
    }
  };

  useEffect(() => {
    if (dataSelecionada && funcionarioSelecionado) {
      carregarHorarios(dataSelecionada);
    }
  }, [dataSelecionada, funcionarioSelecionado]);

  const horariosDisponiveis = useMemo(() => {
    if (!dataSelecionada || !empresa) return [];
    
    // Verificar se dia está fechado ou funcionário não trabalha (usando dados da API)
    if (agendaData?.dia_fechado || agendaData?.funcionario_nao_trabalha) return [];
    
    const diaSemanaIndex = dataSelecionada.getDay();
    const horarioFuncionamento = getHorarioFuncionamento(empresa, diaSemanaIndex);
    
    if (!horarioFuncionamento?.ativo) return [];
    
    // Usar horários retornados pela API (já consideram disponibilidade do funcionário)
    const abertura = agendaData?.horario_abertura || horarioFuncionamento.inicio || empresa.horario_abertura || '09:00';
    const fechamento = agendaData?.horario_fechamento || horarioFuncionamento.fim || empresa.horario_fechamento || '18:00';
    
    const [horaAbertura, minAbertura] = abertura.split(':').map(Number);
    const [horaFechamento, minFechamento] = fechamento.split(':').map(Number);
    
    const duracao = servicoSelecionado?.duracao_minutos || 30;
    const intervalo = 30;
    
    const horarios = [];
    let hora = horaAbertura;
    let minuto = minAbertura;
    
    while (hora < horaFechamento || (hora === horaFechamento && minuto + duracao <= minFechamento)) {
      const horarioStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
      
      const horaInicio = new Date(dataSelecionada);
      horaInicio.setHours(hora, minuto, 0, 0);
      const horaFim = new Date(horaInicio.getTime() + duracao * 60000);
      
      const ocupado = horariosOcupados.some(oc => {
        const ocInicio = new Date(oc.inicio);
        const ocFim = new Date(oc.fim);
        return (horaInicio < ocFim && horaFim > ocInicio);
      });
      
      const passado = horaInicio < new Date();
      
      if (!ocupado && !passado) {
        horarios.push({
          horario: horarioStr,
          dataHora: horaInicio
        });
      }
      
      minuto += intervalo;
      if (minuto >= 60) {
        hora++;
        minuto = 0;
      }
    }
    
    return horarios;
  }, [dataSelecionada, empresa, servicoSelecionado, horariosOcupados, agendaData]);

  const diasDoMes = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const diaSemanaInicio = primeiroDia.getDay();
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: null, disabled: true });
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      const aberto = verificarDiaAberto(empresa, data.getDay());
      const passado = data < hoje;
      
      dias.push({
        dia,
        data,
        disabled: passado || !aberto,
        passado,
        fechado: !aberto
      });
    }
    
    return dias;
  }, [mesAtual, empresa]);

  const diasDaSemana = useMemo(() => {
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const data = new Date(semanaAtual);
      data.setDate(semanaAtual.getDate() + i);
      const aberto = verificarDiaAberto(empresa, data.getDay());
      const passado = data < hoje;
      const isHoje = data.toDateString() === hoje.toDateString();
      
      const agendamentosDia = agendamentosSemana.filter(ag => 
        ag.data === data.toISOString().split('T')[0]
      );
      
      dias.push({
        data,
        diaSemana: data.getDay(),
        aberto,
        passado,
        isHoje,
        agendamentos: agendamentosDia.length
      });
    }
    
    return dias;
  }, [semanaAtual, empresa, agendamentosSemana]);

  const gerarSlotsVisuais = (dia) => {
    if (!empresa || !dia.aberto) return [];
    
    const horario = getHorarioFuncionamento(empresa, dia.diaSemana);
    if (!horario) return [];
    
    const abertura = horario.inicio || empresa.horario_abertura || '09:00';
    const fechamento = horario.fim || empresa.horario_fechamento || '18:00';
    
    const [horaAbertura] = abertura.split(':').map(Number);
    const [horaFechamento] = fechamento.split(':').map(Number);
    
    const slots = [];
    const hoje = new Date();
    
    for (let h = horaAbertura; h < horaFechamento; h++) {
      const slotTime = new Date(dia.data);
      slotTime.setHours(h, 0, 0, 0);
      
      const ocupado = agendamentosSemana.some(ag => {
        const dataAg = ag.data;
        const diaStr = dia.data.toISOString().split('T')[0];
        if (dataAg !== diaStr) return false;
        
        const agInicio = new Date(ag.inicio);
        const agFim = new Date(ag.fim);
        const slotFim = new Date(slotTime.getTime() + 60 * 60000);
        
        return (slotTime < agFim && slotFim > agInicio);
      });
      
      const passado = slotTime < hoje;
      
      slots.push({
        hora: h,
        ocupado: ocupado || passado,
        passado
      });
    }
    
    return slots;
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  const verificarCliente = async () => {
    if (!clienteEmail && !clienteTelefone) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu email ou telefone para continuar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setVerificandoCliente(true);
      const params = new URLSearchParams();
      if (clienteEmail) params.append('email', clienteEmail);
      if (clienteTelefone) params.append('telefone', clienteTelefone.replace(/\D/g, ''));
      
      const response = await fetch(`${API_BASE}/public/verificar-cliente/${slug}?${params}`);
      const result = await response.json();
      
      // Verificar se é conflito de email/telefone (pertence a empresa, usuário ou funcionário)
      if (response.status === 409) {
        toast({
          title: "Email/telefone em uso",
          description: result.message,
          variant: "destructive"
        });
        // Se deve redirecionar para login
        if (result.redirect_login) {
          toast({
            title: "Acesse sua conta",
            description: "Use a área administrativa para gerenciar seus agendamentos",
          });
        }
        return;
      }
      
      if (result.encontrado) {
        setClienteExistente(result.cliente);
        setClienteNome(result.cliente.nome);
        setClienteTelefone(formatarTelefone(result.cliente.telefone || ''));
        setClienteEmail(result.cliente.email || '');
        toast({
          title: "Cliente encontrado!",
          description: `Bem-vindo de volta, ${result.cliente.nome}!`,
        });
      } else {
        setClienteExistente(null);
      }
      setClienteVerificado(true);
    } catch (err) {
      toast({
        title: "Erro ao verificar",
        description: "Não foi possível verificar seus dados",
        variant: "destructive"
      });
    } finally {
      setVerificandoCliente(false);
    }
  };

  const handleSubmit = async () => {
    if (!clienteExistente && (!clienteNome || !clienteTelefone)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha seu nome e telefone",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/public/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          funcionario_id: funcionarioSelecionado.id,
          servico_id: servicoSelecionado.id,
          data_hora: horarioSelecionado.dataHora.toISOString(),
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone.replace(/\D/g, ''),
          cliente_email: clienteEmail || undefined,
          observacoes: observacoes || undefined
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar agendamento');
      }
      
      const result = await response.json();
      setAgendamentoCriado(result.agendamento);
      setStep(5);
      
      toast({
        title: "Agendamento confirmado!",
        description: "Você receberá uma confirmação por email.",
      });
    } catch (err) {
      toast({
        title: "Erro ao agendar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const voltarParaHome = () => {
    setModoAgendamento(false);
    setStep(1);
    setServicoSelecionado(null);
    setFuncionarioSelecionado(null);
    setDataSelecionada(null);
    setHorarioSelecionado(null);
    setClienteNome('');
    setClienteTelefone('');
    setClienteEmail('');
    setObservacoes('');
    setAgendamentoCriado(null);
    setClienteExistente(null);
    setClienteVerificado(false);
    carregarAgendamentosSemana();
  };

  const navegarSemana = (direcao) => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(semanaAtual.getDate() + (direcao * 7));
    
    const hoje = getInicioSemana(new Date());
    if (novaSemana >= hoje) {
      setSemanaAtual(novaSemana);
    }
  };

  const scrollToServicos = () => {
    const element = document.getElementById('secao-servicos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToLocalizacao = () => {
    const element = document.getElementById('secao-localizacao');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const abrirRotaGoogleMaps = () => {
    if (empresa?.endereco) {
      const destino = encodeURIComponent(empresa.endereco);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destino}`, '_blank');
    }
  };

  // Estado para mostrar aviso de email de empresa
  const [emailEmpresaDetectado, setEmailEmpresaDetectado] = useState(false);
  const [nomeEmpresaDetectada, setNomeEmpresaDetectada] = useState('');

  // Funções para verificação de email e consulta de agendamentos
  const enviarCodigoVerificacao = async () => {
    if (!emailConsulta || !emailConsulta.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido para buscar seus agendamentos",
        variant: "destructive"
      });
      return;
    }

    try {
      setEnviandoCodigo(true);
      setEmailEmpresaDetectado(false); // Reset
      
      const response = await fetch(`${API_BASE}/public/enviar-codigo/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailConsulta })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Verificar se é email de empresa ou usuário administrativo
        if (errorData.error === 'email_empresa' || errorData.error === 'email_usuario') {
          setEmailEmpresaDetectado(true);
          setNomeEmpresaDetectada(errorData.empresa_nome || '');
          toast({
            title: "Email de conta administrativa",
            description: errorData.message || "Faça login na área administrativa",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(errorData.message || errorData.error || 'Erro ao enviar código');
      }
      
      const result = await response.json();
      
      if (result.token) {
        setTokenVerificacao(result.token);
        setEtapaVerificacao('codigo');
        toast({
          title: "Código enviado",
          description: "Verifique sua caixa de entrada (e spam) para o código de verificação",
        });
      } else {
        toast({
          title: "Verificação enviada",
          description: "Se houver agendamentos para este email, você receberá um código",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const validarCodigoOTP = async () => {
    if (!codigoOTP || codigoOTP.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Digite o código de 6 dígitos enviado para seu email",
        variant: "destructive"
      });
      return;
    }

    try {
      setValidandoCodigo(true);
      const response = await fetch(`${API_BASE}/public/validar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenVerificacao, codigo: codigoOTP })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.tentativas_restantes !== undefined) {
          toast({
            title: "Código incorreto",
            description: `Você tem mais ${error.tentativas_restantes} tentativa(s)`,
            variant: "destructive"
          });
        } else {
          throw new Error(error.error || 'Erro ao validar código');
        }
        return;
      }
      
      const result = await response.json();
      setTokenAcesso(result.token_acesso);
      setClienteConsulta(result.cliente);
      setEtapaVerificacao('verificado');
      
      toast({
        title: "Email verificado!",
        description: `Bem-vindo de volta, ${result.cliente.nome}`,
      });
      
      // Carregar agendamentos automaticamente
      await carregarAgendamentosVerificados(result.token_acesso);
    } catch (err) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setValidandoCodigo(false);
    }
  };

  // Helper para transformar agendamento (mesmo formato que livegendaApi.js)
  // Extrai data/hora diretamente da string para evitar conversões de timezone
  const transformarAgendamento = (ag) => {
    let data = '';
    let hora_inicio = '';
    let hora_fim = '';
    
    if (ag.data_hora) {
      // Extrair data e hora diretamente da string ISO sem criar Date (evita conversão de timezone)
      // Formato pode ser "2025-12-18T10:30:00" ou "2025-12-18 10:30:00" ou "2025-12-18T10:30:00.000Z"
      const dataHoraStr = String(ag.data_hora);
      const match = dataHoraStr.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
      
      if (match) {
        data = match[1]; // "2025-12-18"
        hora_inicio = `${match[2]}:${match[3]}`; // "10:30"
        
        if (ag.data_hora_fim) {
          const dataHoraFimStr = String(ag.data_hora_fim);
          const matchFim = dataHoraFimStr.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
          if (matchFim) {
            hora_fim = `${matchFim[2]}:${matchFim[3]}`;
          }
        }
      } else {
        // Fallback: parsing tradicional se regex falhar
        try {
          const dataHora = new Date(ag.data_hora);
          if (!isNaN(dataHora.getTime())) {
            data = dataHora.toISOString().split('T')[0];
            hora_inicio = `${String(dataHora.getUTCHours()).padStart(2, '0')}:${String(dataHora.getUTCMinutes()).padStart(2, '0')}`;
            
            if (ag.data_hora_fim) {
              const dataHoraFim = new Date(ag.data_hora_fim);
              if (!isNaN(dataHoraFim.getTime())) {
                hora_fim = `${String(dataHoraFim.getUTCHours()).padStart(2, '0')}:${String(dataHoraFim.getUTCMinutes()).padStart(2, '0')}`;
              }
            }
          }
        } catch (e) {
          console.error('Erro ao parsear data do agendamento:', e);
        }
      }
    }
    
    return {
      ...ag,
      data,
      hora_inicio,
      hora_fim
    };
  };

  const carregarAgendamentosVerificados = async (token) => {
    try {
      setLoadingMeusAgendamentos(true);
      const response = await fetch(`${API_BASE}/public/meus-agendamentos/${slug}?token_acesso=${encodeURIComponent(token)}`);
      
      if (response.status === 401) {
        // Sessão expirada
        toast({
          title: "Sessão expirada",
          description: "Por favor, verifique seu email novamente",
          variant: "destructive"
        });
        resetarVerificacao();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos');
      }
      
      const result = await response.json();
      // Transformar agendamentos para ter data, hora_inicio, hora_fim
      const agendamentosTransformados = (result.agendamentos || []).map(transformarAgendamento);
      setMeusAgendamentos(agendamentosTransformados);
      
      if (result.agendamentos?.length === 0) {
        toast({
          title: "Nenhum agendamento",
          description: "Você não tem agendamentos ativos nesta empresa",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingMeusAgendamentos(false);
    }
  };

  const resetarVerificacao = () => {
    setEtapaVerificacao('email');
    setTokenVerificacao('');
    setTokenAcesso('');
    setCodigoOTP('');
    setClienteConsulta(null);
    setMeusAgendamentos([]);
  };

  const cancelarAgendamento = async () => {
    if (!agendamentoSelecionado || !tokenAcesso) return;
    
    try {
      setCancelando(true);
      const response = await fetch(`${API_BASE}/public/agendamentos/${agendamentoSelecionado.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_acesso: tokenAcesso,
          acao: 'cancelar'
        })
      });
      
      if (response.status === 401) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, verifique seu email novamente",
          variant: "destructive"
        });
        resetarVerificacao();
        setShowCancelarDialog(false);
        return;
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao cancelar agendamento');
      }
      
      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso",
      });
      
      setShowCancelarDialog(false);
      setAgendamentoSelecionado(null);
      
      // Atualizar lista
      await carregarAgendamentosVerificados(tokenAcesso);
    } catch (err) {
      toast({
        title: "Erro ao cancelar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setCancelando(false);
    }
  };

  const carregarHorariosParaRemarcar = async (data) => {
    if (!data || !agendamentoSelecionado) return;
    
    try {
      setLoadingHorariosRemarcar(true);
      const dataStr = data;
      const funcionarioId = agendamentoSelecionado.funcionario?.id;
      
      if (!funcionarioId) return;
      
      const response = await fetch(`${API_BASE}/public/agenda/${slug}/${funcionarioId}/${dataStr}`);
      if (response.ok) {
        const result = await response.json();
        
        // Verificar se dia está fechado ou funcionário não trabalha
        if (result.dia_fechado || result.funcionario_nao_trabalha) {
          setHorariosRemarcar([]);
          return;
        }
        
        // Gerar horários disponíveis usando a mesma lógica do horariosDisponiveis
        const duracao = agendamentoSelecionado.servico?.duracao_minutos || 30;
        const abertura = result.horario_abertura || empresa?.horario_abertura || '09:00';
        const fechamento = result.horario_fechamento || empresa?.horario_fechamento || '18:00';
        
        const [horaAbertura, minAbertura] = abertura.split(':').map(Number);
        const [horaFechamento, minFechamento] = fechamento.split(':').map(Number);
        
        // Criar data base para comparações
        const dataBase = new Date(dataStr + "T00:00:00");
        const agora = new Date();
        
        const horarios = [];
        let hora = horaAbertura;
        let minuto = minAbertura;
        
        while (hora < horaFechamento || (hora === horaFechamento && minuto + duracao <= minFechamento)) {
          const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
          
          // Criar timestamp do horário
          const horaInicio = new Date(dataBase);
          horaInicio.setHours(hora, minuto, 0, 0);
          const horaFim = new Date(horaInicio.getTime() + duracao * 60 * 1000);
          
          // Verificar se está ocupado usando comparação de timestamps
          const ocupados = result.horarios_ocupados || [];
          const estaOcupado = ocupados.some(slot => {
            const slotInicio = new Date(slot.inicio);
            const slotFim = new Date(slot.fim);
            return (horaInicio < slotFim && horaFim > slotInicio);
          });
          
          // Verificar se horário já passou
          const passado = horaInicio < agora;
          
          if (!estaOcupado && !passado) {
            horarios.push(horaStr);
          }
          
          minuto += 30;
          if (minuto >= 60) {
            hora++;
            minuto = 0;
          }
        }
        
        setHorariosRemarcar(horarios);
      }
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
    } finally {
      setLoadingHorariosRemarcar(false);
    }
  };

  const remarcarAgendamento = async () => {
    if (!agendamentoSelecionado || !novaDataRemarcar || !novaHoraRemarcar || !tokenAcesso) {
      toast({
        title: "Dados incompletos",
        description: "Selecione a nova data e horário",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setRemarcando(true);
      const response = await fetch(`${API_BASE}/public/agendamentos/${agendamentoSelecionado.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_acesso: tokenAcesso,
          acao: 'remarcar',
          nova_data: novaDataRemarcar,
          nova_hora: novaHoraRemarcar
        })
      });
      
      if (response.status === 401) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, verifique seu email novamente",
          variant: "destructive"
        });
        resetarVerificacao();
        setShowRemarcarDialog(false);
        return;
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remarcar agendamento');
      }
      
      toast({
        title: "Agendamento remarcado",
        description: "Seu agendamento foi remarcado com sucesso",
      });
      
      setShowRemarcarDialog(false);
      setAgendamentoSelecionado(null);
      setNovaDataRemarcar('');
      setNovaHoraRemarcar('');
      setHorariosRemarcar([]);
      
      // Atualizar lista
      await carregarAgendamentosVerificados(tokenAcesso);
    } catch (err) {
      toast({
        title: "Erro ao remarcar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setRemarcando(false);
    }
  };

  const fecharMeusAgendamentos = () => {
    setShowMeusAgendamentos(false);
    setEmailConsulta('');
    setMeusAgendamentos([]);
    setClienteConsulta(null);
    resetarVerificacao();
  };

  const abrirMeusAgendamentos = async () => {
    setShowMeusAgendamentos(true);
    
    // Se já estiver verificado, recarregar os agendamentos para garantir dados atualizados
    if (tokenAcesso && etapaVerificacao === 'verificado') {
      await carregarAgendamentosVerificados(tokenAcesso);
    }
  };

  const formatarDataAgendamento = (dataStr) => {
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmado</Badge>;
      case 'agendado':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Agendado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAgendamentoFuturo = (dataStr) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAgendamento = new Date(dataStr + 'T00:00:00');
    return dataAgendamento >= hoje;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
            <p className="text-gray-500">Verifique o endereço e tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <Toaster />
      
      <header className="bg-white border-b border-purple-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {empresa?.logo ? (
                <img src={resolveObjectUrl(empresa.logo)} alt={empresa.nome} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-gray-900" data-testid="text-empresa-nome">{empresa?.nome}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {empresa?.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {empresa.telefone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {modoAgendamento && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={voltarParaHome}
                data-testid="button-voltar-home"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
        </div>
      </header>

      {!modoAgendamento && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-[73px] z-10">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={scrollToServicos}
                className="text-purple-700 hover:bg-purple-50"
                data-testid="button-ver-servicos"
              >
                <Scissors className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Serviços</span>
              </Button>
              {empresa?.endereco && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={scrollToLocalizacao}
                  className="text-purple-700 hover:bg-purple-50"
                  data-testid="button-ver-localizacao"
                >
                  <MapPin className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Localização</span>
                </Button>
              )}
              <Button 
                variant="ghost"
                size="sm"
                onClick={abrirMeusAgendamentos}
                className="text-purple-700 hover:bg-purple-50"
                data-testid="button-meus-agendamentos"
              >
                <CalendarCheck className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Meus Agendamentos</span>
              </Button>
              <Button 
                onClick={() => setModoAgendamento(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30 px-3 sm:px-6 font-semibold h-8 sm:h-9 text-sm sm:text-base"
                data-testid="button-iniciar-agendamento"
              >
                <CalendarPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Agendar Agora</span>
                <span className="sm:hidden">Agendar</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Meus Agendamentos */}
      <Dialog open={showMeusAgendamentos} onOpenChange={setShowMeusAgendamentos}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
              Meus Agendamentos
            </DialogTitle>
            <DialogDescription>
              {etapaVerificacao === 'email' && 'Digite seu email para receber um código de verificação'}
              {etapaVerificacao === 'codigo' && 'Digite o código de 6 dígitos enviado para seu email'}
              {etapaVerificacao === 'verificado' && `Seus agendamentos em ${empresa?.nome}`}
            </DialogDescription>
          </DialogHeader>

          {etapaVerificacao === 'email' && (
            <div className="space-y-4 py-4">
              {/* Alerta quando email de empresa é detectado */}
              {emailEmpresaDetectado && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-amber-800">
                        Email de conta administrativa
                      </p>
                      <p className="text-sm text-amber-700">
                        {nomeEmpresaDetectada 
                          ? `Este email pertence à empresa "${nomeEmpresaDetectada}".`
                          : 'Este email pertence a uma conta de empresa.'}
                        {' '}Para acessar, faça login na área administrativa.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => window.location.href = '/login'}
                    data-testid="button-ir-para-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Ir para Login
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={emailConsulta}
                  onChange={(e) => {
                    setEmailConsulta(e.target.value);
                    setEmailEmpresaDetectado(false); // Reset ao digitar
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && enviarCodigoVerificacao()}
                  data-testid="input-email-consulta"
                />
                <Button
                  onClick={enviarCodigoVerificacao}
                  disabled={enviandoCodigo}
                  data-testid="button-enviar-codigo"
                >
                  {enviandoCodigo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Enviaremos um código de verificação para o seu email.
              </p>
            </div>
          )}

          {etapaVerificacao === 'codigo' && (
            <div className="space-y-4 py-4">
              <div className="bg-purple-50 rounded-lg p-3 text-sm">
                <p className="text-purple-800">
                  Código enviado para <strong>{emailConsulta}</strong>
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Código de verificação</label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={codigoOTP}
                  onChange={(e) => setCodigoOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && validarCodigoOTP()}
                  className="text-center text-2xl tracking-widest font-mono"
                  data-testid="input-codigo-otp"
                />
              </div>
              
              <Button
                onClick={validarCodigoOTP}
                disabled={validandoCodigo || codigoOTP.length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-validar-codigo"
              >
                {validandoCodigo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verificar Código
                  </>
                )}
              </Button>
              
              <div className="flex justify-between text-sm">
                <button
                  onClick={resetarVerificacao}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-voltar-email"
                >
                  Voltar
                </button>
                <button
                  onClick={enviarCodigoVerificacao}
                  disabled={enviandoCodigo}
                  className="text-purple-600 hover:text-purple-800"
                  data-testid="button-reenviar-codigo"
                >
                  {enviandoCodigo ? 'Enviando...' : 'Reenviar código'}
                </button>
              </div>
            </div>
          )}

          {etapaVerificacao === 'verificado' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">{clienteConsulta?.nome}</span>
                </div>
                <button
                  onClick={resetarVerificacao}
                  className="text-sm text-green-600 hover:text-green-800"
                  data-testid="button-trocar-email"
                >
                  Trocar email
                </button>
              </div>

              {meusAgendamentos.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum agendamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meusAgendamentos.map((ag) => (
                    <Card 
                      key={ag.id} 
                      className={`${!isAgendamentoFuturo(ag.data) ? 'opacity-60' : ''}`}
                      data-testid={`card-agendamento-${ag.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(ag.status)}
                              {!isAgendamentoFuturo(ag.data) && (
                                <Badge variant="outline" className="text-gray-500">Passado</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Scissors className="w-4 h-4 text-purple-600" />
                                <span className="font-medium">{ag.servico?.nome}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{ag.funcionario?.nome}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="capitalize">{formatarDataAgendamento(ag.data)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{ag.hora_inicio} - {ag.hora_fim}</span>
                              </div>
                            </div>
                          </div>

                          {isAgendamentoFuturo(ag.data) && ag.status !== 'cancelado' && (
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                onClick={() => {
                                  setAgendamentoSelecionado(ag);
                                  setShowRemarcarDialog(true);
                                  setNovaDataRemarcar('');
                                  setNovaHoraRemarcar('');
                                  setHorariosRemarcar([]);
                                }}
                                data-testid={`button-remarcar-${ag.id}`}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                Remarcar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  setAgendamentoSelecionado(ag);
                                  setShowCancelarDialog(true);
                                }}
                                data-testid={`button-cancelar-${ag.id}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Cancelamento */}
      <Dialog open={showCancelarDialog} onOpenChange={setShowCancelarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Cancelar Agendamento
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento?
            </DialogDescription>
          </DialogHeader>

          {agendamentoSelecionado && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-gray-500" />
                  <span>{agendamentoSelecionado.servico?.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{formatarDataAgendamento(agendamentoSelecionado.data)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{agendamentoSelecionado.hora_inicio}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelarDialog(false)}
              disabled={cancelando}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={cancelarAgendamento}
              disabled={cancelando}
              data-testid="button-confirmar-cancelamento"
            >
              {cancelando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Remarcar */}
      <Dialog open={showRemarcarDialog} onOpenChange={setShowRemarcarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <RefreshCw className="w-5 h-5" />
              Remarcar Agendamento
            </DialogTitle>
            <DialogDescription>
              Escolha uma nova data e horário para o seu agendamento
            </DialogDescription>
          </DialogHeader>

          {agendamentoSelecionado && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">{agendamentoSelecionado.servico?.nome}</p>
                <p className="text-gray-600">com {agendamentoSelecionado.funcionario?.nome}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nova Data
                  </label>
                  <Input
                    type="date"
                    value={novaDataRemarcar}
                    onChange={(e) => {
                      setNovaDataRemarcar(e.target.value);
                      setNovaHoraRemarcar('');
                      if (e.target.value) {
                        carregarHorariosParaRemarcar(e.target.value);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-nova-data"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Novo Horário
                  </label>
                  {loadingHorariosRemarcar ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando horários...
                    </div>
                  ) : novaDataRemarcar ? (
                    horariosRemarcar.length > 0 ? (
                      <Select value={novaHoraRemarcar} onValueChange={setNovaHoraRemarcar}>
                        <SelectTrigger data-testid="select-nova-hora">
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {horariosRemarcar.map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-orange-600 py-2">
                        Nenhum horário disponível nesta data
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      Selecione uma data primeiro
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemarcarDialog(false);
                setNovaDataRemarcar('');
                setNovaHoraRemarcar('');
              }}
              disabled={remarcando}
            >
              Cancelar
            </Button>
            <Button
              onClick={remarcarAgendamento}
              disabled={remarcando || !novaDataRemarcar || !novaHoraRemarcar}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirmar-remarcacao"
            >
              {remarcando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Remarcando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Remarcação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!modoAgendamento ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card 
                className="mb-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                onClick={() => setModoAgendamento(true)}
                data-testid="card-agenda-semana"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Agenda da Semana
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Veja a disponibilidade e agende seu horário
                  </p>
                </CardHeader>
                
                <CardContent>
                  {funcionarios.length > 1 && (
                    <div 
                      className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Select
                        value={filtroFuncionarioId || "all"}
                        onValueChange={(value) => setFiltroFuncionarioId(value === "all" ? null : value)}
                      >
                        <SelectTrigger 
                          className="w-full sm:w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="select-filtro-funcionario"
                        >
                          <SelectValue placeholder="Filtrar por profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os profissionais</SelectItem>
                          {funcionarios.map((func) => (
                            <SelectItem key={func.id} value={func.id}>
                              {func.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div 
                    className="flex items-center justify-between mb-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navegarSemana(-1)}
                      disabled={semanaAtual <= getInicioSemana(new Date())}
                      data-testid="button-semana-anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    
                    <span className="text-sm font-medium text-gray-700">
                      {formatarDataCurta(semanaAtual)} - {formatarDataCurta(new Date(semanaAtual.getTime() + 6 * 24 * 60 * 60 * 1000))}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navegarSemana(1)}
                      data-testid="button-proxima-semana"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {loadingSemana ? (
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(7)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:grid grid-cols-7 gap-1 mb-1">
                        {diasDaSemana.map((dia, index) => (
                          <div 
                            key={index}
                            className={`text-center text-xs font-medium py-1 rounded-t ${
                              dia.isHoje ? 'bg-purple-100 text-purple-700' : 'text-gray-500'
                            }`}
                          >
                            <div>{DIAS_NOMES[dia.diaSemana]}</div>
                            <div className={`text-lg font-bold ${dia.isHoje ? 'text-purple-700' : 'text-gray-900'}`}>
                              {dia.data.getDate()}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="hidden md:grid grid-cols-7 gap-1">
                        {diasDaSemana.map((dia, index) => {
                          const slots = gerarSlotsVisuais(dia);
                          
                          return (
                            <div 
                              key={index}
                              className={`border rounded-b p-1 min-h-[120px] ${
                                dia.isHoje ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100'
                              } ${!dia.aberto ? 'bg-gray-50' : ''}`}
                            >
                              {!dia.aberto ? (
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-400">Fechado</span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  {slots.map((slot, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-2 rounded-sm ${
                                        slot.ocupado 
                                          ? 'bg-purple-200' 
                                          : 'bg-green-100'
                                      }`}
                                      title={`${slot.hora}:00 - ${slot.ocupado ? 'Ocupado' : 'Disponível'}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="md:hidden space-y-2">
                        {diasDaSemana.map((dia, index) => {
                          const slots = gerarSlotsVisuais(dia);
                          const slotsLivres = slots.filter(s => !s.ocupado).length;
                          
                          return (
                            <div 
                              key={index}
                              className={`border rounded-lg p-3 ${
                                dia.isHoje ? 'border-purple-300 bg-purple-50' : 'border-gray-100'
                              } ${!dia.aberto ? 'bg-gray-50 opacity-60' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                                    dia.isHoje ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    <span className="text-xs font-medium">{DIAS_NOMES[dia.diaSemana]}</span>
                                    <span className="text-sm font-bold">{dia.data.getDate()}</span>
                                  </div>
                                  
                                  <div>
                                    <p className="font-medium text-gray-900 capitalize">
                                      {dia.data.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {dia.data.toLocaleDateString('pt-BR', { month: 'long' })}
                                    </p>
                                  </div>
                                </div>
                                
                                {dia.aberto ? (
                                  <Badge 
                                    variant={slotsLivres > 3 ? 'default' : slotsLivres > 0 ? 'secondary' : 'outline'}
                                    className={slotsLivres > 3 ? 'bg-green-100 text-green-700' : ''}
                                  >
                                    {slotsLivres > 0 ? `${slotsLivres} horários` : 'Lotado'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400">
                                    Fechado
                                  </Badge>
                                )}
                              </div>
                              
                              {dia.aberto && (
                                <div className="mt-2 flex gap-0.5">
                                  {slots.slice(0, 10).map((slot, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex-1 h-1.5 rounded-full ${
                                        slot.ocupado ? 'bg-purple-200' : 'bg-green-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-green-100" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-purple-200" />
                      <span>Ocupado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card id="secao-servicos" className="scroll-mt-32">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-purple-600" />
                    Nossos Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servicos.map((servico) => (
                      <div
                        key={servico.id}
                        onClick={() => {
                          setServicoSelecionado(servico);
                          setModoAgendamento(true);
                          setStep(2);
                        }}
                        className="border border-gray-100 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
                        data-testid={`card-servico-${servico.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{servico.nome}</h3>
                            {servico.descricao && (
                              <p className="text-sm text-gray-500 mt-1">{servico.descricao}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            R$ {Number(servico.preco).toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{servico.duracao_minutos} min</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">Clique para agendar</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {empresa?.endereco && (
                <Card id="secao-localizacao" className="mt-6 scroll-mt-32">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-900">Localização</h3>
                          <p className="text-sm text-gray-500 mt-1">{empresa.endereco}</p>
                        </div>
                      </div>
                      <Button
                        onClick={abrirRotaGoogleMaps}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 shrink-0"
                        data-testid="button-tracar-rota"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Traçar Rota
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="agendamento"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {step < 5 && (
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          step > s
                            ? 'bg-green-500 text-white'
                            : step === s
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                      </div>
                    ))}
                  </div>
                  
                  {step > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(step - 1)}
                      data-testid="button-voltar"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Scissors className="w-5 h-5 text-purple-600" />
                          Escolha o serviço
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {servicos.map((servico) => (
                          <button
                            key={servico.id}
                            onClick={() => {
                              setServicoSelecionado(servico);
                              setStep(2);
                            }}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover-elevate ${
                              servicoSelecionado?.id === servico.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-100 hover:border-purple-200'
                            }`}
                            data-testid={`button-servico-${servico.id}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{servico.nome}</h3>
                                {servico.descricao && (
                                  <p className="text-sm text-gray-500 mt-1">{servico.descricao}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{servico.duracao_minutos} min</span>
                                </div>
                              </div>
                              <Badge className="bg-purple-100 text-purple-700 border-0">
                                R$ {Number(servico.preco).toFixed(2)}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="w-5 h-5 text-purple-600" />
                          Escolha o profissional
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {funcionariosParaServico.map((funcionario) => (
                          <button
                            key={funcionario.id}
                            onClick={() => {
                              setFuncionarioSelecionado(funcionario);
                              setStep(3);
                            }}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover-elevate ${
                              funcionarioSelecionado?.id === funcionario.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-100 hover:border-purple-200'
                            }`}
                            data-testid={`button-funcionario-${funcionario.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {funcionario.foto ? (
                                <img 
                                  src={funcionario.foto} 
                                  alt={funcionario.nome}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                                  style={{ backgroundColor: funcionario.cor || '#8B5CF6' }}
                                >
                                  {funcionario.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-gray-900">{funcionario.nome}</h3>
                                {funcionario.cargo && (
                                  <p className="text-sm text-gray-500">{funcionario.cargo}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          Escolha a data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const novoMes = new Date(mesAtual);
                              novoMes.setMonth(mesAtual.getMonth() - 1);
                              if (novoMes >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)) {
                                setMesAtual(novoMes);
                              }
                            }}
                            data-testid="button-mes-anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          
                          <h3 className="font-medium text-gray-900 capitalize">
                            {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </h3>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const novoMes = new Date(mesAtual);
                              novoMes.setMonth(mesAtual.getMonth() + 1);
                              setMesAtual(novoMes);
                            }}
                            data-testid="button-proximo-mes"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {DIAS_NOMES.map((dia) => (
                            <div key={dia} className="text-center text-xs font-medium text-gray-500 py-2">
                              {dia}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {diasDoMes.map((item, index) => (
                            <button
                              key={index}
                              disabled={item.disabled || !item.dia}
                              onClick={() => {
                                setDataSelecionada(item.data);
                                setHorarioSelecionado(null);
                              }}
                              className={`
                                aspect-square rounded-lg text-sm font-medium transition-all
                                ${!item.dia ? 'invisible' : ''}
                                ${item.disabled 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : dataSelecionada?.toDateString() === item.data?.toDateString()
                                    ? 'bg-purple-600 text-white'
                                    : 'hover:bg-purple-100 text-gray-700'
                                }
                                ${item.fechado ? 'bg-gray-50' : ''}
                              `}
                              data-testid={item.dia ? `button-dia-${item.dia}` : undefined}
                            >
                              {item.dia}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {dataSelecionada && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="w-5 h-5 text-purple-600" />
                            Horários disponíveis
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              {formatarData(dataSelecionada)}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingHorarios ? (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-10" />
                              ))}
                            </div>
                          ) : horariosDisponiveis.length > 0 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {horariosDisponiveis.map((h) => (
                                <button
                                  key={h.horario}
                                  onClick={() => {
                                    setHorarioSelecionado(h);
                                    setStep(4);
                                  }}
                                  className={`
                                    py-2 px-3 rounded-lg text-sm font-medium transition-all hover-elevate
                                    ${horarioSelecionado?.horario === h.horario
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                                    }
                                  `}
                                  data-testid={`button-horario-${h.horario.replace(':', '')}`}
                                >
                                  {h.horario}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              Nenhum horário disponível nesta data.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-6">
                        <h3 className="font-medium text-purple-900 mb-3">Resumo do agendamento</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-purple-700">Serviço:</span>
                            <span className="font-medium text-purple-900">{servicoSelecionado?.nome}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700">Profissional:</span>
                            <span className="font-medium text-purple-900">{funcionarioSelecionado?.nome}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700">Data:</span>
                            <span className="font-medium text-purple-900 capitalize">
                              {dataSelecionada?.toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700">Horário:</span>
                            <span className="font-medium text-purple-900">{horarioSelecionado?.horario}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-purple-200">
                            <span className="text-purple-700">Valor:</span>
                            <span className="font-bold text-purple-900">
                              R$ {Number(servicoSelecionado?.preco).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="w-5 h-5 text-purple-600" />
                          {clienteVerificado && clienteExistente ? 'Bem-vindo de volta!' : 'Identificação'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!clienteVerificado ? (
                          <>
                            <p className="text-sm text-gray-600">
                              Informe seu email ou telefone para verificarmos se você já possui cadastro.
                            </p>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Email
                              </label>
                              <Input
                                type="email"
                                value={clienteEmail}
                                onChange={(e) => setClienteEmail(e.target.value)}
                                placeholder="seu@email.com"
                                data-testid="input-cliente-email"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="flex-1 h-px bg-gray-200" />
                              <span>ou</span>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Telefone
                              </label>
                              <Input
                                value={clienteTelefone}
                                onChange={(e) => setClienteTelefone(formatarTelefone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                data-testid="input-cliente-telefone"
                              />
                            </div>
                            
                            <Button
                              onClick={verificarCliente}
                              disabled={verificandoCliente || (!clienteEmail && !clienteTelefone)}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                              data-testid="button-verificar-cliente"
                            >
                              {verificandoCliente ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Verificando...
                                </>
                              ) : (
                                'Continuar'
                              )}
                            </Button>
                          </>
                        ) : clienteExistente ? (
                          <>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-green-800 font-medium">{clienteExistente.nome}</p>
                              <p className="text-green-600 text-sm">{clienteExistente.email || clienteExistente.telefone}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Observações (opcional)
                              </label>
                              <Textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Alguma informação adicional para este agendamento..."
                                rows={3}
                                data-testid="input-observacoes"
                              />
                            </div>
                            
                            <Button
                              onClick={handleSubmit}
                              disabled={submitting}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                              data-testid="button-confirmar-agendamento"
                            >
                              {submitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Confirmando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirmar Agendamento
                                </>
                              )}
                            </Button>
                            
                            <button
                              onClick={() => {
                                setClienteVerificado(false);
                                setClienteExistente(null);
                                setClienteNome('');
                                setClienteTelefone('');
                                setClienteEmail('');
                              }}
                              className="w-full text-sm text-gray-500 hover:text-gray-700"
                              data-testid="button-trocar-cliente"
                            >
                              Não é você? Usar outro email/telefone
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-blue-800 text-sm">
                                Não encontramos seu cadastro. Preencha seus dados para continuar.
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Nome completo *
                              </label>
                              <Input
                                value={clienteNome}
                                onChange={(e) => setClienteNome(e.target.value)}
                                placeholder="Seu nome"
                                data-testid="input-cliente-nome"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Telefone *
                              </label>
                              <Input
                                value={clienteTelefone}
                                onChange={(e) => setClienteTelefone(formatarTelefone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                data-testid="input-cliente-telefone-novo"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Email *
                              </label>
                              <Input
                                type="email"
                                value={clienteEmail}
                                onChange={(e) => setClienteEmail(e.target.value)}
                                placeholder="seu@email.com"
                                data-testid="input-cliente-email-novo"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Observações (opcional)
                              </label>
                              <Textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Alguma informação adicional..."
                                rows={3}
                                data-testid="input-observacoes"
                              />
                            </div>
                            
                            <Button
                              onClick={handleSubmit}
                              disabled={submitting || !clienteNome || !clienteTelefone || !clienteEmail}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                              data-testid="button-confirmar-agendamento"
                            >
                              {submitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Confirmando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirmar Agendamento
                                </>
                              )}
                            </Button>
                            
                            <button
                              onClick={() => {
                                setClienteVerificado(false);
                                setClienteNome('');
                                setClienteTelefone('');
                                setClienteEmail('');
                              }}
                              className="w-full text-sm text-gray-500 hover:text-gray-700"
                              data-testid="button-voltar-verificacao"
                            >
                              Voltar e tentar outro email/telefone
                            </button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === 5 && agendamentoCriado && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="text-center">
                      <CardContent className="pt-8 pb-8">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Agendamento Confirmado!
                        </h2>
                        
                        <p className="text-gray-500 mb-6">
                          Seu horário foi reservado com sucesso
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto mb-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Scissors className="w-5 h-5 text-purple-600" />
                              <span className="text-gray-700">{servicoSelecionado?.nome}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5 text-purple-600" />
                              <span className="text-gray-700">{funcionarioSelecionado?.nome}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-purple-600" />
                              <span className="text-gray-700 capitalize">
                                {dataSelecionada?.toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-purple-600" />
                              <span className="text-gray-700">{horarioSelecionado?.horario}</span>
                            </div>
                          </div>
                        </div>
                        
                        {clienteEmail && (
                          <p className="text-sm text-gray-500 mb-6">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Enviamos uma confirmação para {clienteEmail}
                          </p>
                        )}
                        
                        <Button
                          onClick={voltarParaHome}
                          variant="outline"
                          data-testid="button-novo-agendamento"
                        >
                          Fazer outro agendamento
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Botão Sticky - Encontrar outros serviços (cores invertidas) */}
      <Link 
        to="/buscar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        data-testid="link-buscar-servicos"
      >
        <Button 
          className="bg-white hover:bg-gray-50 text-purple-600 hover:text-purple-700 border-2 border-purple-200 hover:border-purple-300 shadow-md gap-2 px-6 py-5 rounded-full text-sm font-medium"
        >
          <Navigation className="w-4 h-4" />
          Encontrar outros serviços perto de você
        </Button>
      </Link>

      <footer className="py-6 text-center text-sm text-gray-400 pb-24">
        <p>
          Agendamento online por{' '}
          <a href="https://livegenda.com" className="text-purple-600 hover:underline">
            Livegenda
          </a>
        </p>
      </footer>
    </div>
  );
}
