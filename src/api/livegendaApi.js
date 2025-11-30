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

// Helper to populate agendamentos with full objects
const populateAgendamentos = async (agendamentos, empresaId) => {
  if (!empresaId || agendamentos.length === 0) return agendamentos;
  
  const [clientes, funcionarios, servicos] = await Promise.all([
    apiRequest(`/clientes?empresa_id=${empresaId}`),
    apiRequest(`/funcionarios?empresa_id=${empresaId}`),
    apiRequest(`/servicos?empresa_id=${empresaId}`)
  ]);
  
  return agendamentos.map(ag => ({
    ...ag,
    cliente: clientes.find(c => c.id === ag.cliente_id),
    funcionario: funcionarios.find(f => f.id === ag.funcionario_id),
    servico: servicos.find(s => s.id === ag.servico_id)
  }));
};

// Helper functions for horario conversion
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
      
      return data;
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
          
          // Converter para formato do formulario
          return {
            nome_negocio: empresa.nome,
            categoria: empresa.categoria,
            whatsapp: empresa.telefone,
            email: empresa.email,
            endereco: empresa.endereco,
            cep: empresa.cep || '',
            logo_url: empresa.logo || '',
            horario_funcionamento: convertHorarioToForm(empresa.horario_funcionamento)
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
            endereco: data.endereco
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
        
        const result = await apiRequest(`/empresas/${user.empresa_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: data.nome_negocio,
            tipo: data.categoria,
            telefone: data.whatsapp,
            email: data.email,
            endereco: data.endereco,
            cep: data.cep,
            logo_url: data.logo_url,
            horario_funcionamento: convertHorarioFromForm(data.horario_funcionamento)
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
