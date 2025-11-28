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
    const data = getFromStorage(this.entityName);
    // Populate agendamentos with related objects
    if (this.entityName === 'agendamentos') {
      return populateAgendamentos(data);
    }
    // Return data directly for compatibility with useQuery
    return data;
  }

  async get(id) {
    const data = getFromStorage(this.entityName);
    const item = data.find(d => d.id === id);
    return { data: item, error: item ? null : { message: 'Not found' } };
  }

  async create(item) {
    const data = getFromStorage(this.entityName);
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    saveToStorage(this.entityName, data);
    // Return newItem directly for compatibility
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
    // Return updated item directly
    return data[index];
  }

  async delete(id) {
    const data = getFromStorage(this.entityName);
    const filtered = data.filter(d => d.id !== id);
    saveToStorage(this.entityName, filtered);
    // Return success directly
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
    // Simple mock authentication
    if (password.length >= 6) {
      const user = { ...mockUser, email };
      localStorage.setItem('livegenda_user', JSON.stringify(user));
      return { data: user, error: null };
    }
    return { data: null, error: { message: 'Invalid credentials' } };
  },
  
  async signOut() {
    localStorage.removeItem('livegenda_user');
    return { data: { success: true }, error: null };
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
        // Retorna a empresa do usuário logado
        const user = await mockAuth.getUser();
        if (!user || !user.empresa_id) return { data: null, error: null };
        const empresas = getFromStorage('empresas', []);
        const empresa = empresas.find(e => e.id === user.empresa_id);
        return { data: empresa, error: null };
      },
      async update(updates) {
        const data = getFromStorage('configuracao', mockConfiguracaoNegocio);
        const updated = { ...data, ...updates };
        saveToStorage('configuracao', updated);
        return { data: updated, error: null };
      }
    }
  },
  auth: mockAuth,
  integrations: {
    Core: {
      InvokeLLM: async () => ({ data: null, error: null }),
      SendEmail: async () => ({ data: { success: true }, error: null }),
      UploadFile: async () => ({ data: { url: '#' }, error: null }),
      GenerateImage: async () => ({ data: { url: '#' }, error: null }),
      ExtractDataFromUploadedFile: async () => ({ data: {}, error: null }),
      CreateFileSignedUrl: async () => ({ data: { url: '#' }, error: null }),
      UploadPrivateFile: async () => ({ data: { url: '#' }, error: null })
    }
  }
};

export default mockClient;
