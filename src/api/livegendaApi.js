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
    // Primeiro, tentar do usuario
    const user = getCurrentUser();
    if (user?.empresa_id) {
      return user.empresa_id;
    }
    
    // Fallback: tentar da empresa salva separadamente
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
    if (!empresaId) return [];
    
    try {
      let data = await apiRequest(`/${this.entityName}?empresa_id=${empresaId}`);
      
      if (this.entityName === 'agendamentos') {
        data = await populateAgendamentos(data, empresaId);
      }
      
      return data;
    } catch (error) {
      console.error(`Error listing ${this.entityName}:`, error);
      return [];
    }
  }

  async get(id) {
    try {
      return await apiRequest(`/${this.entityName}/${id}`);
    } catch (error) {
      console.error(`Error getting ${this.entityName}:`, error);
      return null;
    }
  }

  async create(data) {
    const empresaId = getCurrentEmpresaId();
    if (!empresaId) throw new Error('Empresa nao configurada');
    
    const payload = { ...data, empresa_id: empresaId };
    return await apiRequest(`/${this.entityName}`, {
      method: 'POST',
      body: JSON.stringify(payload)
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

  async filter(criteria) {
    const all = await this.list();
    return all.filter(item => {
      return Object.entries(criteria).every(([key, value]) => item[key] === value);
    });
  }
}

// Auth API - uses /api/auth endpoints
const livegendaAuth = {
  isLoggedIn: async () => {
    return !!getCurrentUser();
  },
  
  getUser: async () => {
    return getCurrentUser();
  },
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }
      
      // Save user and empresa to localStorage
      localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
      if (data.empresa) {
        localStorage.setItem('livegenda_empresa', JSON.stringify(data.empresa));
      }
      
      return data.usuario;
    } catch (error) {
      throw new Error('Erro ao fazer login: ' + error.message);
    }
  },
  
  logout: async () => {
    localStorage.removeItem('livegenda_user');
    localStorage.removeItem('livegenda_empresa');
  },
  
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          senha: userData.senha || userData.password,
          nome: userData.nome || userData.email.split('@')[0]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar');
      }
      
      localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
      return data.usuario;
    } catch (error) {
      throw new Error('Erro ao registrar: ' + error.message);
    }
  },
  
  onboarding: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer onboarding');
      }
      
      localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
      localStorage.setItem('livegenda_empresa', JSON.stringify(data.empresa));
      return data;
    } catch (error) {
      throw new Error('Erro ao fazer onboarding: ' + error.message);
    }
  }
};

// Main Livegenda API client
export const livegenda = {
  entities: {
    Funcionario: new ApiEntity('funcionarios'),
    Cliente: new ApiEntity('clientes'),
    Servico: new ApiEntity('servicos'),
    Agendamento: new ApiEntity('agendamentos'),
    ConfiguracaoNegocio: {
      async get() {
        const user = await livegendaAuth.getUser();
        if (!user || !user.empresa_id) return null;
        
        try {
          const empresa = await apiRequest(`/empresas/${user.empresa_id}`);
          return {
            id: empresa.id,
            nome_negocio: empresa.nome,
            categoria: empresa.tipo,
            whatsapp: empresa.telefone,
            email: empresa.email,
            endereco: empresa.endereco,
            cep: empresa.cep,
            logo_url: empresa.logo_url,
            horario_funcionamento: convertHorarioToForm(empresa.horario_funcionamento)
          };
        } catch (error) {
          console.error('Error getting config:', error);
          return null;
        }
      },
      
      async create(data) {
        const empresa = await apiRequest('/empresas', {
          method: 'POST',
          body: JSON.stringify({
            nome: data.nome_negocio,
            tipo: data.categoria,
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
        const user = await livegendaAuth.getUser();
        if (!user || !user.empresa_id) throw new Error('Empresa nao encontrada');
        
        return await apiRequest(`/empresas/${user.empresa_id}`, {
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
