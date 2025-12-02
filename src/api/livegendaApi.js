// Livegenda API Client - connects to Cloudflare Pages Functions
const API_BASE = '/api';

// Helper to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
};

// Get current user from localStorage
const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('livegenda_user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error('Erro ao ler usuario do localStorage:', e);
    return null;
  }
};

// Get empresa_id com fallback
const getCurrentEmpresaId = () => {
  try {
    const user = getCurrentUser();
    if (user?.empresa_id) {
      return user.empresa_id;
    }
    
    const empresaStr = localStorage.getItem('livegenda_empresa');
    if (empresaStr) {
      const empresa = JSON.parse(empresaStr);
      if (empresa?.id) {
        return empresa.id;
      }
    }
    
    console.warn('empresa_id nao encontrado no localStorage');
    return null;
  } catch (e) {
    console.error('Erro ao obter empresa_id:', e);
    return null;
  }
};

// Helper to transform agendamento from API format to frontend format
// Extrai data/hora diretamente da string para evitar conversões de timezone na exibição
const transformAgendamento = (ag) => {
  let data = '';
  let hora_inicio = '';
  let hora_fim = '';
  let duracao_minutos = 30;
  
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
        const matchFim = dataHoraFimStr.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
        if (matchFim) {
          hora_fim = `${matchFim[2]}:${matchFim[3]}`;
          
          // Calcular duração usando timestamps completos (inclui data para agendamentos que cruzam meia-noite)
          const dataInicioCompleta = `${match[1]}T${match[2]}:${match[3]}:00`;
          const dataFimCompleta = `${matchFim[1]}T${matchFim[2]}:${matchFim[3]}:00`;
          const tsInicio = new Date(dataInicioCompleta).getTime();
          const tsFim = new Date(dataFimCompleta).getTime();
          if (!isNaN(tsInicio) && !isNaN(tsFim) && tsFim > tsInicio) {
            duracao_minutos = Math.round((tsFim - tsInicio) / 60000);
          }
        }
      }
    } else {
      // Fallback: parsing tradicional se regex falhar (formato inesperado)
      console.warn('Formato de data inesperado, usando fallback:', dataHoraStr);
      try {
        const dataHora = new Date(ag.data_hora);
        if (!isNaN(dataHora.getTime())) {
          // Usar getUTCHours para consistência (dados armazenados em UTC)
          data = dataHora.toISOString().split('T')[0];
          hora_inicio = `${String(dataHora.getUTCHours()).padStart(2, '0')}:${String(dataHora.getUTCMinutes()).padStart(2, '0')}`;
          
          if (ag.data_hora_fim) {
            const dataHoraFim = new Date(ag.data_hora_fim);
            if (!isNaN(dataHoraFim.getTime())) {
              hora_fim = `${String(dataHoraFim.getUTCHours()).padStart(2, '0')}:${String(dataHoraFim.getUTCMinutes()).padStart(2, '0')}`;
              duracao_minutos = Math.round((dataHoraFim - dataHora) / 60000);
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
    hora_fim,
    duracao_minutos
  };
};

// Helper to populate agendamentos with full objects
const populateAgendamentos = async (agendamentos, empresaId) => {
  if (!empresaId || agendamentos.length === 0) return agendamentos;
  
  const [clientes, funcionarios, servicos] = await Promise.all([
    apiRequest(`/clientes?empresa_id=${empresaId}`),
    apiRequest(`/funcionarios?empresa_id=${empresaId}`),
    apiRequest(`/servicos?empresa_id=${empresaId}`)
  ]);
  
  return agendamentos.map(ag => {
    const transformed = transformAgendamento(ag);
    return {
      ...transformed,
      cliente: clientes.find(c => c.id === ag.cliente_id),
      funcionario: funcionarios.find(f => f.id === ag.funcionario_id),
      servico: servicos.find(s => s.id === ag.servico_id)
    };
  });
};

// Mapeamento de abreviações para nomes completos
const ABREV_TO_DIA = {
  'seg': 'segunda',
  'ter': 'terca',
  'qua': 'quarta',
  'qui': 'quinta',
  'sex': 'sexta',
  'sab': 'sabado',
  'dom': 'domingo'
};

// Helper functions for horario conversion
// Constrói o objeto horario_funcionamento a partir dos dados do banco (dias_funcionamento array)
const buildHorarioFromDias = (diasFuncionamento, horarioAbertura, horarioFechamento) => {
  const result = {};
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  const abertura = horarioAbertura || "09:00";
  const fechamento = horarioFechamento || "18:00";
  
  // Se não tem dias_funcionamento, usar padrão seg-sex
  const diasAtivos = diasFuncionamento || ['seg', 'ter', 'qua', 'qui', 'sex'];
  
  dias.forEach(dia => {
    // Encontrar a abreviação correspondente ao dia
    const abrev = Object.keys(ABREV_TO_DIA).find(k => ABREV_TO_DIA[k] === dia);
    const ativo = diasAtivos.includes(abrev);
    
    result[dia] = {
      ativo: ativo,
      abertura: abertura,
      fechamento: dia === 'sabado' ? "14:00" : fechamento
    };
  });
  
  return result;
};

const convertHorarioToForm = (horarioFuncionamento) => {
  if (!horarioFuncionamento) {
    return {
      segunda: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      terca: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      quarta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      quinta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      sexta: { ativo: true, abertura: "09:00", fechamento: "18:00" },
      sabado: { ativo: true, abertura: "09:00", fechamento: "14:00" },
      domingo: { ativo: false, abertura: "09:00", fechamento: "18:00" }
    };
  }
  
  const result = {};
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  
  dias.forEach(dia => {
    const horario = horarioFuncionamento[dia];
    if (horario) {
      result[dia] = {
        ativo: horario.ativo !== false,
        abertura: horario.inicio || horario.abertura || "09:00",
        fechamento: horario.fim || horario.fechamento || "18:00"
      };
    } else {
      result[dia] = { ativo: false, abertura: "09:00", fechamento: "18:00" };
    }
  });
  
  return result;
};

const convertHorarioFromForm = (horario_funcionamento) => {
  if (!horario_funcionamento) return null;
  
  const result = {};
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  
  dias.forEach(dia => {
    const h = horario_funcionamento[dia];
    if (h) {
      result[dia] = {
        inicio: h.abertura,
        fim: h.fechamento,
        ativo: h.ativo
      };
    }
  });
  
  return result;
};

// Mapeia dias completos para abreviações usadas no banco
const DIAS_ABREV_MAP = {
  'segunda': 'seg',
  'terca': 'ter',
  'quarta': 'qua',
  'quinta': 'qui',
  'sexta': 'sex',
  'sabado': 'sab',
  'domingo': 'dom'
};

// Extrai array de dias ativos a partir do horario_funcionamento
const extractDiasFuncionamento = (horario_funcionamento) => {
  if (!horario_funcionamento) return null;
  
  const diasAtivos = [];
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  
  dias.forEach(dia => {
    const h = horario_funcionamento[dia];
    // Considera ativo se ativo === true ou se ativo não está definido mas tem horário
    if (h && h.ativo === true) {
      diasAtivos.push(DIAS_ABREV_MAP[dia]);
    }
  });
  
  return diasAtivos;
};

// Transform entities to add nome_completo alias for backwards compatibility
const transformEntity = (entity, entityName) => {
  if (!entity) return entity;
  
  // Add nome_completo as alias for nome (for clientes and funcionarios)
  if ((entityName === 'clientes' || entityName === 'funcionarios') && entity.nome && !entity.nome_completo) {
    entity.nome_completo = entity.nome;
  }
  
  return entity;
};

// API Entity class
class ApiEntity {
  constructor(entityName) {
    this.entityName = entityName;
  }

  async list() {
    const empresaId = getCurrentEmpresaId();
    if (!empresaId) {
      console.warn(`${this.entityName}.list(): empresa_id nao encontrado`);
      return [];
    }
    
    try {
      const data = await apiRequest(`/${this.entityName}?empresa_id=${empresaId}`);
      
      // Populate agendamentos with related data
      if (this.entityName === 'agendamentos') {
        return await populateAgendamentos(data, empresaId);
      }
      
      // Transform entities to add nome_completo
      return data.map(item => transformEntity(item, this.entityName));
    } catch (error) {
      console.error(`Erro em ${this.entityName}.list():`, error);
      return [];
    }
  }

  async get(id) {
    return await apiRequest(`/${this.entityName}/${id}`);
  }

  async create(data) {
    const empresaId = getCurrentEmpresaId();
    return await apiRequest(`/${this.entityName}`, {
      method: 'POST',
      body: JSON.stringify({ ...data, empresa_id: empresaId })
    });
  }

  async update(id, data) {
    return await apiRequest(`/${this.entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(id) {
    return await apiRequest(`/${this.entityName}/${id}`, {
      method: 'DELETE'
    });
  }
}

// Auth helper
const livegendaAuth = {
  getUser: async () => {
    return getCurrentUser();
  },
  login: async (email, senha) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    if (result.user) {
      localStorage.setItem('livegenda_user', JSON.stringify(result.user));
    }
    return result;
  },
  logout: async () => {
    localStorage.removeItem('livegenda_user');
    localStorage.removeItem('livegenda_empresa');
  },
  register: async (data) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// Main API object
export const livegenda = {
  entities: {
    Agendamento: new ApiEntity('agendamentos'),
    Cliente: new ApiEntity('clientes'),
    Funcionario: new ApiEntity('funcionarios'),
    Servico: new ApiEntity('servicos'),
    Empresa: new ApiEntity('empresas'),
    
    // ConfiguracaoNegocio - busca/atualiza empresa do usuario
    ConfiguracaoNegocio: {
      async get() {
        const user = getCurrentUser();
        if (!user || !user.empresa_id) {
          console.warn('ConfiguracaoNegocio.get(): usuario ou empresa_id nao encontrado');
          return null;
        }
        
        try {
          const empresa = await apiRequest(`/empresas/${user.empresa_id}`);
          
          // Construir horario_funcionamento a partir dos dados do banco (dias_funcionamento array)
          const horarioFuncionamento = buildHorarioFromDias(
            empresa.dias_funcionamento,
            empresa.horario_abertura,
            empresa.horario_fechamento
          );
          
          // Converter para formato do formulario (incluindo campos de endereco estruturado)
          return {
            nome_negocio: empresa.nome,
            categoria: empresa.categoria,
            whatsapp: empresa.telefone,
            email: empresa.email,
            endereco: empresa.endereco,
            // Campos de endereco estruturado
            logradouro: empresa.logradouro || '',
            bairro: empresa.bairro || '',
            cidade: empresa.cidade || '',
            estado: empresa.estado || '',
            cep: empresa.cep || '',
            logo_url: empresa.logo || '',
            // Horario construído a partir de dias_funcionamento do banco
            horario_funcionamento: horarioFuncionamento,
            // Campos de funcionamento originais
            dias_funcionamento: empresa.dias_funcionamento,
            horario_abertura: empresa.horario_abertura,
            horario_fechamento: empresa.horario_fechamento
          };
        } catch (error) {
          console.error('Erro ao buscar configuracao:', error);
          return null;
        }
      },
      
      async create(data) {
        const empresa = await apiRequest('/empresas', {
          method: 'POST',
          body: JSON.stringify({
            nome: data.nome_negocio,
            categoria: data.categoria,
            telefone: data.whatsapp,
            email: data.email,
            endereco: data.endereco,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.cidade,
            estado: data.estado,
            cep: data.cep
          })
        });
        
        const user = getCurrentUser();
        if (user) {
          user.empresa_id = empresa.id;
          localStorage.setItem('livegenda_user', JSON.stringify(user));
        }
        
        return empresa;
      },
      
      async update(data) {
        const user = getCurrentUser();
        if (!user || !user.empresa_id) throw new Error('Empresa nao encontrada');
        
        // Extrair dias de funcionamento do horario_funcionamento
        const diasFuncionamento = extractDiasFuncionamento(data.horario_funcionamento);
        
        const result = await apiRequest(`/empresas/${user.empresa_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: data.nome_negocio,
            categoria: data.categoria,
            telefone: data.whatsapp,
            email: data.email,
            // Campos de endereco estruturado
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.cidade,
            estado: data.estado,
            cep: data.cep,
            logo_url: data.logo_url,
            horario_funcionamento: convertHorarioFromForm(data.horario_funcionamento),
            // Array de dias ativos para filtrar calendário
            dias_funcionamento: diasFuncionamento
          })
        });
        
        return result;
      }
    }
  },
  auth: livegendaAuth,
  integrations: {
    Core: {
      InvokeLLM: async () => ({ data: null, error: null }),
      SendEmail: async () => ({ data: { success: true }, error: null }),
      UploadFile: async ({ file }) => ({ file_url: URL.createObjectURL(file) }),
      GenerateImage: async () => ({ data: { url: '#' }, error: null }),
      ExtractDataFromUploadedFile: async () => ({ data: {}, error: null }),
      CreateFileSignedUrl: async () => ({ data: { url: '#' }, error: null }),
      UploadPrivateFile: async () => ({ data: { url: '#' }, error: null })
    }
  }
};

export default livegenda;
