// Mock client to replace Base44 SDK
import {
  mockEmpresas,
  mockFuncionarios,
  mockClientes,
  mockServicos,
  mockAgendamentos,
  mockUsuarios
} from './mockData';

// Simulate localStorage database
const getFromStorage = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize storage with mock data if empty
const initializeStorage = () => {
  if (!localStorage.getItem('empresas')) {
    saveToStorage('empresas', mockEmpresas);
  }
  if (!localStorage.getItem('funcionarios')) {
    saveToStorage('funcionarios', mockFuncionarios);
  }
  if (!localStorage.getItem('clientes')) {
    saveToStorage('clientes', mockClientes);
  }
  if (!localStorage.getItem('servicos')) {
    saveToStorage('servicos', mockServicos);
  }
  if (!localStorage.getItem('agendamentos')) {
    saveToStorage('agendamentos', mockAgendamentos);
  }
  if (!localStorage.getItem('usuarios')) {
    saveToStorage('usuarios', mockUsuarios);
  }
};

initializeStorage();

// Helper functions para converter formato de horário - DEFINIDAS ANTES DO USO
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

// Helper to get current user's empresa_id
const getCurrentEmpresaId = () => {
  const user = localStorage.getItem('livegenda_user');
  if (!user) return null;
  const parsed = JSON.parse(user);
  return parsed.empresa_id;
};

// Helper to populate agendamentos with full objects
const populateAgendamentos = (agendamentos) => {
  const clientes = getFromStorage('clientes', []);
  const funcionarios = getFromStorage('funcionarios', []);
  const servicos = getFromStorage('servicos', []);
  
  return agendamentos.map(ag => ({
    ...ag,
    cliente: clientes.find(c => c.id === ag.cliente_id),
    funcionario: funcionarios.find(f => f.id === ag.funcionario_id),
    servico: servicos.find(s => s.id === ag.servico_id)
  }));
};

// Mock entity class
class MockEntity {
  constructor(entityName) {
    this.entityName = entityName;
  }

  async list() {
    const empresaId = getCurrentEmpresaId();
    let data = getFromStorage(this.entityName);
    
    // Retornar array vazio se não houver empresa_id para entidades multi-tenant
    if (['funcionarios', 'clientes', 'servicos', 'agendamentos'].includes(this.entityName)) {
      if (!empresaId) {
        return [];
      }
      data = data.filter(item => item.empresa_id === empresaId);
    }
    
    // Populate agendamentos with related objects
    if (this.entityName === 'agendamentos') {
      return populateAgendamentos(data);
    }
    
    return data;
  }

  async get(id) {
    const data = getFromStorage(this.entityName);
    const item = data.find(d => d.id === id);
    return item || null;
  }

  async create(item) {
    const empresaId = getCurrentEmpresaId();
    
    // Impedir criação sem empresa_id para entidades multi-tenant
    if (['funcionarios', 'clientes', 'servicos', 'agendamentos'].includes(this.entityName)) {
      if (!empresaId && !item.empresa_id) {
        throw new Error('Empresa não definida. Faça login novamente.');
      }
    }
    
    const data = getFromStorage(this.entityName);
    const newItem = {
      ...item,
      id: Date.now().toString(),
      empresa_id: item.empresa_id || empresaId,
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    saveToStorage(this.entityName, data);
    return newItem;
  }

  async update(id, updates) {
    const data = getFromStorage(this.entityName);
    const index = data.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Not found');
    }
    data[index] = { ...data[index], ...updates };
    saveToStorage(this.entityName, data);
    return data[index];
  }

  async delete(id) {
    const data = getFromStorage(this.entityName);
    const filtered = data.filter(d => d.id !== id);
    saveToStorage(this.entityName, filtered);
    return { success: true };
  }
}

// Mock auth
const mockAuth = {
  async getUser() {
    const user = localStorage.getItem('livegenda_user');
    return user ? JSON.parse(user) : null;
  },
  
  async signIn(email, password) {
    const usuarios = getFromStorage('usuarios', []);
    const user = usuarios.find(u => u.email === email && u.senha === password);
    
    if (user) {
      localStorage.setItem('livegenda_user', JSON.stringify(user));
      return { data: user, error: null };
    }
    
    // Para teste: criar usuário se não existir
    if (password.length >= 6) {
      const newUser = {
        id: Date.now().toString(),
        email,
        senha: password,
        tipo: 'gestor',
        empresa_id: null,
        primeiro_acesso: true
      };
      usuarios.push(newUser);
      saveToStorage('usuarios', usuarios);
      localStorage.setItem('livegenda_user', JSON.stringify(newUser));
      return { data: newUser, error: null };
    }
    
    return { data: null, error: { message: 'Credenciais inválidas' } };
  },
  
  async logout() {
    localStorage.removeItem('livegenda_user');
    return { data: { success: true }, error: null };
  },
  
  async signOut() {
    return this.logout();
  }
};

// Mock client that mimics Base44 SDK structure
export const mockClient = {
  entities: {
    Empresa: new MockEntity('empresas'),
    Funcionario: new MockEntity('funcionarios'),
    Cliente: new MockEntity('clientes'),
    Servico: new MockEntity('servicos'),
    Agendamento: new MockEntity('agendamentos'),
    Usuario: new MockEntity('usuarios'),
    ConfiguracaoNegocio: {
      async get() {
        const user = await mockAuth.getUser();
        if (!user || !user.empresa_id) return null;
        
        const empresas = getFromStorage('empresas', []);
        const empresa = empresas.find(e => e.id === user.empresa_id);
        
        if (!empresa) return null;
        
        // Mapear campos da empresa para formato esperado pelo componente
        const horarioConvertido = convertHorarioToForm(empresa.horarioFuncionamento);
        
        return {
          id: empresa.id,
          nome_negocio: empresa.nome,
          categoria: empresa.categoria || 'salao',
          whatsapp: empresa.telefone,
          email: empresa.email,
          endereco: empresa.endereco,
          cep: empresa.cep || '',
          logo_url: empresa.logo_url || '',
          horario_funcionamento: horarioConvertido,
          // Também incluir formato original para compatibilidade com DateTimePicker
          horarioFuncionamento: empresa.horarioFuncionamento,
          intervaloAgendamento: empresa.intervaloAgendamento || 30,
          lembreteAutomatico: empresa.lembreteAutomatico !== false,
          tempoAntecedenciaLembrete: empresa.tempoAntecedenciaLembrete || 24
        };
      },
      
      async create(data) {
        const user = await mockAuth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const empresas = getFromStorage('empresas', []);
        const horarioConvertido = convertHorarioFromForm(data.horario_funcionamento);
        
        const newEmpresa = {
          id: Date.now().toString(),
          nome: data.nome_negocio,
          categoria: data.categoria,
          telefone: data.whatsapp,
          email: data.email,
          endereco: data.endereco,
          cep: data.cep,
          logo_url: data.logo_url,
          horarioFuncionamento: horarioConvertido,
          intervaloAgendamento: 30,
          lembreteAutomatico: true,
          tempoAntecedenciaLembrete: 24,
          createdAt: new Date().toISOString()
        };
        
        empresas.push(newEmpresa);
        saveToStorage('empresas', empresas);
        
        // Atualizar empresa_id do usuário
        user.empresa_id = newEmpresa.id;
        user.primeiro_acesso = false;
        localStorage.setItem('livegenda_user', JSON.stringify(user));
        
        // Atualizar na lista de usuários também
        const usuarios = getFromStorage('usuarios', []);
        const userIndex = usuarios.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          usuarios[userIndex] = user;
          saveToStorage('usuarios', usuarios);
        }
        
        return newEmpresa;
      },
      
      async update(data) {
        const user = await mockAuth.getUser();
        if (!user || !user.empresa_id) throw new Error('Empresa não encontrada');
        
        const empresas = getFromStorage('empresas', []);
        const index = empresas.findIndex(e => e.id === user.empresa_id);
        
        if (index === -1) throw new Error('Empresa não encontrada');
        
        const horarioConvertido = convertHorarioFromForm(data.horario_funcionamento);
        
        empresas[index] = {
          ...empresas[index],
          nome: data.nome_negocio,
          categoria: data.categoria,
          telefone: data.whatsapp,
          email: data.email,
          endereco: data.endereco,
          cep: data.cep,
          logo_url: data.logo_url,
          horarioFuncionamento: horarioConvertido
        };
        
        saveToStorage('empresas', empresas);
        return empresas[index];
      }
    }
  },
  auth: mockAuth,
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

export default mockClient;
