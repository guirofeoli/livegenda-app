// Mock data for multi-tenant app

// ========================================
// EMPRESAS
// ========================================
export const mockEmpresas = [
  {
    id: '1',
    nome: 'Salão Beleza Total',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 3456-7890',
    email: 'contato@belezatotal.com',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    horarioFuncionamento: {
      segunda: { inicio: '09:00', fim: '18:00', ativo: true },
      terca: { inicio: '09:00', fim: '18:00', ativo: true },
      quarta: { inicio: '09:00', fim: '18:00', ativo: true },
      quinta: { inicio: '09:00', fim: '18:00', ativo: true },
      sexta: { inicio: '09:00', fim: '19:00', ativo: true },
      sabado: { inicio: '09:00', fim: '15:00', ativo: true },
      domingo: { inicio: null, fim: null, ativo: false }
    },
    intervaloAgendamento: 30,
    lembreteAutomatico: true,
    tempoAntecedenciaLembrete: 24,
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '2',
    nome: 'Barbearia Estilo Masculino',
    cnpj: '23.456.789/0001-80',
    telefone: '(11) 3456-7891',
    email: 'contato@estilomasculino.com',
    endereco: 'Av. Paulista, 1000 - São Paulo, SP',
    horarioFuncionamento: {
      segunda: { inicio: '10:00', fim: '20:00', ativo: true },
      terca: { inicio: '10:00', fim: '20:00', ativo: true },
      quarta: { inicio: '10:00', fim: '20:00', ativo: true },
      quinta: { inicio: '10:00', fim: '20:00', ativo: true },
      sexta: { inicio: '10:00', fim: '21:00', ativo: true },
      sabado: { inicio: '09:00', fim: '18:00', ativo: true },
      domingo: { inicio: null, fim: null, ativo: false }
    },
    intervaloAgendamento: 30,
    lembreteAutomatico: true,
    tempoAntecedenciaLembrete: 12,
    createdAt: new Date('2023-06-20').toISOString()
  },
  {
    id: '3',
    nome: 'Espaço Estética & Bem-Estar',
    cnpj: '34.567.890/0001-70',
    telefone: '(11) 3456-7892',
    email: 'contato@espacoestetica.com',
    endereco: 'Rua Augusta, 500 - São Paulo, SP',
    horarioFuncionamento: {
      segunda: { inicio: '08:00', fim: '18:00', ativo: true },
      terca: { inicio: '08:00', fim: '18:00', ativo: true },
      quarta: { inicio: '08:00', fim: '18:00', ativo: true },
      quinta: { inicio: '08:00', fim: '18:00', ativo: true },
      sexta: { inicio: '08:00', fim: '18:00', ativo: true },
      sabado: { inicio: '08:00', fim: '14:00', ativo: true },
      domingo: { inicio: null, fim: null, ativo: false }
    },
    intervaloAgendamento: 30,
    lembreteAutomatico: true,
    tempoAntecedenciaLembrete: 24,
    createdAt: new Date('2023-09-10').toISOString()
  }
];

// ========================================
// FUNCIONÁRIOS
// ========================================
export const mockFuncionarios = [
  // Empresa 1: Salão Beleza Total
  {
    id: '1',
    empresa_id: '1',
    nome_completo: 'João Silva',
    email: 'joao@livegenda.com',
    telefone: '(11) 98765-4321',
    cargo: 'Barbeiro',
    status: 'Ativo',
    foto_url: '',
    data_vinculacao: '2023-02-01',
    permissoes: {
      acessar_agenda: true,
      criar_agendamentos: true,
      editar_agendamentos: true,
      visualizar_relatorios: true
    },
    createdAt: new Date('2023-02-01').toISOString()
  },
  {
    id: '2',
    empresa_id: '1',
    nome_completo: 'Maria Santos',
    email: 'maria@livegenda.com',
    telefone: '(11) 98765-4322',
    cargo: 'Manicure',
    status: 'Ativo',
    foto_url: '',
    data_vinculacao: '2023-03-15',
    permissoes: {
      acessar_agenda: true,
      criar_agendamentos: true,
      editar_agendamentos: false,
      visualizar_relatorios: false
    },
    createdAt: new Date('2023-03-15').toISOString()
  },
  // Empresa 2: Barbearia Estilo Masculino
  {
    id: '3',
    empresa_id: '2',
    nome_completo: 'Pedro Costa',
    email: 'pedro@livegenda.com',
    telefone: '(11) 98765-4323',
    cargo: 'Barbeiro',
    status: 'Ativo',
    foto_url: '',
    data_vinculacao: '2023-07-01',
    permissoes: {
      acessar_agenda: true,
      criar_agendamentos: true,
      editar_agendamentos: true,
      visualizar_relatorios: false
    },
    createdAt: new Date('2023-07-01').toISOString()
  },
  // Empresa 3: Espaço Estética & Bem-Estar
  {
    id: '4',
    empresa_id: '3',
    nome_completo: 'Carla Rodrigues',
    email: 'carla@livegenda.com',
    telefone: '(11) 98765-4324',
    cargo: 'Esteticista',
    status: 'Ativo',
    foto_url: '',
    data_vinculacao: '2023-10-01',
    permissoes: {
      acessar_agenda: true,
      criar_agendamentos: true,
      editar_agendamentos: true,
      visualizar_relatorios: true
    },
    createdAt: new Date('2023-10-01').toISOString()
  }
];

// ========================================
// CLIENTES (podem ser compartilhados entre empresas)
// ========================================
export const mockClientes = [
  {
    id: '1',
    nome_completo: 'Ana Paula',
    email: 'ana@email.com',
    telefone: '(11) 91234-5678',
    observacoes: 'Cliente VIP',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Alta',
    createdAt: new Date('2023-02-10').toISOString()
  },
  {
    id: '2',
    nome_completo: 'Carlos Mendes',
    email: 'carlos@email.com',
    telefone: '(11) 91234-5679',
    observacoes: '',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Média',
    createdAt: new Date('2023-03-20').toISOString()
  },
  {
    id: '3',
    nome_completo: 'Juliana Oliveira',
    email: 'juliana@email.com',
    telefone: '(11) 91234-5680',
    observacoes: 'Prefere horários de manhã',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Alta',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '4',
    nome_completo: 'Roberto Silva',
    email: 'roberto@email.com',
    telefone: '(11) 91234-5681',
    observacoes: '',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Baixa',
    createdAt: new Date('2023-08-01').toISOString()
  },
  {
    id: '5',
    nome_completo: 'Fernanda Costa',
    email: 'fernanda@email.com',
    telefone: '(11) 91234-5682',
    observacoes: 'Alérgica a alguns produtos',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Média',
    createdAt: new Date('2023-04-10').toISOString()
  },
  {
    id: '6',
    nome_completo: 'Marcos Almeida',
    email: 'marcos@email.com',
    telefone: '(11) 91234-5683',
    observacoes: '',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Média',
    createdAt: new Date('2023-07-15').toISOString()
  },
  {
    id: '7',
    nome_completo: 'Beatriz Lima',
    email: 'beatriz@email.com',
    telefone: '(11) 91234-5684',
    observacoes: 'Gosta de tratamentos relaxantes',
    foto_url: '',
    status: 'Ativa',
    frequencia: 'Alta',
    createdAt: new Date('2023-10-20').toISOString()
  }
];

// ========================================
// SERVIÇOS (por empresa)
// ========================================
export const mockServicos = [
  // Empresa 1: Salão Beleza Total
  {
    id: '1',
    empresa_id: '1',
    nome: 'Corte de Cabelo',
    descricao: 'Corte masculino ou feminino',
    duracao_minutos: 30,
    preco: 50.00,
    status: 'Ativo',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '2',
    empresa_id: '1',
    nome: 'Manicure',
    descricao: 'Cuidados com as unhas',
    duracao_minutos: 45,
    preco: 40.00,
    status: 'Ativo',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '3',
    empresa_id: '1',
    nome: 'Hidratação',
    descricao: 'Tratamento capilar profundo',
    duracao_minutos: 60,
    preco: 80.00,
    status: 'Ativo',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '4',
    empresa_id: '1',
    nome: 'Escova',
    descricao: 'Escova modeladora',
    duracao_minutos: 40,
    preco: 45.00,
    status: 'Ativo',
    createdAt: new Date('2023-01-15').toISOString()
  },
  // Empresa 2: Barbearia Estilo Masculino
  {
    id: '5',
    empresa_id: '2',
    nome: 'Corte Masculino',
    descricao: 'Corte tradicional ou moderno',
    duracao_minutos: 30,
    preco: 45.00,
    status: 'Ativo',
    createdAt: new Date('2023-06-20').toISOString()
  },
  {
    id: '6',
    empresa_id: '2',
    nome: 'Barba',
    descricao: 'Aparar e modelar barba',
    duracao_minutos: 20,
    preco: 30.00,
    status: 'Ativo',
    createdAt: new Date('2023-06-20').toISOString()
  },
  {
    id: '7',
    empresa_id: '2',
    nome: 'Corte + Barba',
    descricao: 'Combo completo',
    duracao_minutos: 45,
    preco: 70.00,
    status: 'Ativo',
    createdAt: new Date('2023-06-20').toISOString()
  },
  // Empresa 3: Espaço Estética & Bem-Estar
  {
    id: '8',
    empresa_id: '3',
    nome: 'Limpeza de Pele',
    descricao: 'Limpeza profunda facial',
    duracao_minutos: 60,
    preco: 120.00,
    status: 'Ativo',
    createdAt: new Date('2023-09-10').toISOString()
  },
  {
    id: '9',
    empresa_id: '3',
    nome: 'Massagem Relaxante',
    descricao: 'Massagem corporal',
    duracao_minutos: 50,
    preco: 100.00,
    status: 'Ativo',
    createdAt: new Date('2023-09-10').toISOString()
  },
  {
    id: '10',
    empresa_id: '3',
    nome: 'Drenagem Linfática',
    descricao: 'Drenagem corporal',
    duracao_minutos: 60,
    preco: 110.00,
    status: 'Ativo',
    createdAt: new Date('2023-09-10').toISOString()
  }
];

// ========================================
// AGENDAMENTOS (por empresa)
// ========================================
export const mockAgendamentos = [
  // Empresa 1: Salão Beleza Total (João e Maria)
  {
    id: '1',
    empresa_id: '1',
    cliente_id: '1', // Ana Paula
    funcionario_id: '1', // João Silva
    servico_id: '1', // Corte de Cabelo
    data: '2025-11-28',
    hora_inicio: '10:00',
    duracao_minutos: 30,
    preco: 50.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-20').toISOString()
  },
  {
    id: '2',
    empresa_id: '1',
    cliente_id: '2', // Carlos Mendes
    funcionario_id: '2', // Maria Santos
    servico_id: '2', // Manicure
    data: '2025-11-28',
    hora_inicio: '14:00',
    duracao_minutos: 45,
    preco: 40.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-21').toISOString()
  },
  {
    id: '3',
    empresa_id: '1',
    cliente_id: '3', // Juliana Oliveira
    funcionario_id: '1', // João Silva
    servico_id: '1', // Corte
    data: '2025-11-28',
    hora_inicio: '09:00',
    duracao_minutos: 30,
    preco: 50.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: false,
    createdAt: new Date('2025-11-22').toISOString()
  },
  {
    id: '4',
    empresa_id: '1',
    cliente_id: '1', // Ana Paula
    funcionario_id: '2', // Maria Santos
    servico_id: '3', // Hidratação
    data: '2025-11-28',
    hora_inicio: '15:00',
    duracao_minutos: 60,
    preco: 80.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-23').toISOString()
  },
  {
    id: '5',
    empresa_id: '1',
    cliente_id: '5', // Fernanda Costa
    funcionario_id: '1', // João Silva
    servico_id: '1', // Corte
    data: '2025-11-29',
    hora_inicio: '11:00',
    duracao_minutos: 30,
    preco: 50.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: false,
    sincronizar_google: true,
    createdAt: new Date('2025-11-24').toISOString()
  },
  {
    id: '6',
    empresa_id: '1',
    cliente_id: '3', // Juliana Oliveira
    funcionario_id: '2', // Maria Santos
    servico_id: '4', // Escova
    data: '2025-11-29',
    hora_inicio: '16:00',
    duracao_minutos: 40,
    preco: 45.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-25').toISOString()
  },
  {
    id: '7',
    empresa_id: '1',
    cliente_id: '2', // Carlos Mendes
    funcionario_id: '1', // João Silva
    servico_id: '1', // Corte
    data: '2025-11-30',
    hora_inicio: '10:30',
    duracao_minutos: 30,
    preco: 50.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-26').toISOString()
  },
  {
    id: '8',
    empresa_id: '1',
    cliente_id: '5', // Fernanda Costa
    funcionario_id: '2', // Maria Santos
    servico_id: '2', // Manicure
    data: '2025-11-30',
    hora_inicio: '14:30',
    duracao_minutos: 45,
    preco: 40.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-26').toISOString()
  },
  
  // Empresa 2: Barbearia Estilo Masculino (Pedro)
  {
    id: '9',
    empresa_id: '2',
    cliente_id: '2', // Carlos Mendes (compartilhado)
    funcionario_id: '3', // Pedro Costa
    servico_id: '5', // Corte Masculino
    data: '2025-11-28',
    hora_inicio: '11:00',
    duracao_minutos: 30,
    preco: 45.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-21').toISOString()
  },
  {
    id: '10',
    empresa_id: '2',
    cliente_id: '4', // Roberto Silva (compartilhado)
    funcionario_id: '3', // Pedro Costa
    servico_id: '6', // Barba
    data: '2025-11-28',
    hora_inicio: '14:00',
    duracao_minutos: 20,
    preco: 30.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: false,
    createdAt: new Date('2025-11-22').toISOString()
  },
  {
    id: '11',
    empresa_id: '2',
    cliente_id: '6', // Marcos Almeida
    funcionario_id: '3', // Pedro Costa
    servico_id: '7', // Corte + Barba
    data: '2025-11-29',
    hora_inicio: '16:00',
    duracao_minutos: 45,
    preco: 70.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-23').toISOString()
  },
  {
    id: '12',
    empresa_id: '2',
    cliente_id: '2', // Carlos Mendes
    funcionario_id: '3', // Pedro Costa
    servico_id: '5', // Corte Masculino
    data: '2025-11-30',
    hora_inicio: '12:00',
    duracao_minutos: 30,
    preco: 45.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-24').toISOString()
  },
  {
    id: '13',
    empresa_id: '2',
    cliente_id: '4', // Roberto Silva
    funcionario_id: '3', // Pedro Costa
    servico_id: '7', // Corte + Barba
    data: '2025-12-01',
    hora_inicio: '15:00',
    duracao_minutos: 45,
    preco: 70.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: false,
    sincronizar_google: true,
    createdAt: new Date('2025-11-25').toISOString()
  },
  
  // Empresa 3: Espaço Estética & Bem-Estar (Carla)
  {
    id: '14',
    empresa_id: '3',
    cliente_id: '1', // Ana Paula (compartilhado)
    funcionario_id: '4', // Carla Rodrigues
    servico_id: '8', // Limpeza de Pele
    data: '2025-11-28',
    hora_inicio: '10:00',
    duracao_minutos: 60,
    preco: 120.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-20').toISOString()
  },
  {
    id: '15',
    empresa_id: '3',
    cliente_id: '3', // Juliana Oliveira (compartilhado)
    funcionario_id: '4', // Carla Rodrigues
    servico_id: '9', // Massagem Relaxante
    data: '2025-11-28',
    hora_inicio: '14:00',
    duracao_minutos: 50,
    preco: 100.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-21').toISOString()
  },
  {
    id: '16',
    empresa_id: '3',
    cliente_id: '7', // Beatriz Lima
    funcionario_id: '4', // Carla Rodrigues
    servico_id: '10', // Drenagem Linfática
    data: '2025-11-29',
    hora_inicio: '09:00',
    duracao_minutos: 60,
    preco: 110.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: false,
    createdAt: new Date('2025-11-22').toISOString()
  },
  {
    id: '17',
    empresa_id: '3',
    cliente_id: '5', // Fernanda Costa (compartilhado)
    funcionario_id: '4', // Carla Rodrigues
    servico_id: '8', // Limpeza de Pele
    data: '2025-11-30',
    hora_inicio: '11:00',
    duracao_minutos: 60,
    preco: 120.00,
    status: 'Confirmado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-23').toISOString()
  },
  {
    id: '18',
    empresa_id: '3',
    cliente_id: '1', // Ana Paula
    funcionario_id: '4', // Carla Rodrigues
    servico_id: '9', // Massagem Relaxante
    data: '2025-12-01',
    hora_inicio: '15:00',
    duracao_minutos: 50,
    preco: 100.00,
    status: 'Agendado',
    observacoes: '',
    enviar_whatsapp: true,
    sincronizar_google: true,
    createdAt: new Date('2025-11-24').toISOString()
  }
];

// ========================================
// USUÁRIOS (autenticação)
// ========================================
export const mockUsuarios = [
  // Funcionários da Empresa 1
  {
    id: '1',
    email: 'joao@livegenda.com',
    senha: '123456',
    tipo: 'funcionario',
    funcionario_id: '1',
    empresa_id: '1',
    primeiro_acesso: false
  },
  {
    id: '2',
    email: 'maria@livegenda.com',
    senha: '123456',
    tipo: 'funcionario',
    funcionario_id: '2',
    empresa_id: '1',
    primeiro_acesso: false
  },
  // Funcionário da Empresa 2
  {
    id: '3',
    email: 'pedro@livegenda.com',
    senha: '123456',
    tipo: 'funcionario',
    funcionario_id: '3',
    empresa_id: '2',
    primeiro_acesso: false
  },
  // Funcionária da Empresa 3
  {
    id: '4',
    email: 'carla@livegenda.com',
    senha: '123456',
    tipo: 'funcionario',
    funcionario_id: '4',
    empresa_id: '3',
    primeiro_acesso: false
  },
  // Gestor da Empresa 1
  {
    id: '5',
    email: 'gestor1@livegenda.com',
    senha: '123456',
    tipo: 'gestor',
    funcionario_id: null,
    empresa_id: '1',
    primeiro_acesso: false
  },
  // Gestor da Empresa 2
  {
    id: '6',
    email: 'gestor2@livegenda.com',
    senha: '123456',
    tipo: 'gestor',
    funcionario_id: null,
    empresa_id: '2',
    primeiro_acesso: false
  },
  // Gestor da Empresa 3
  {
    id: '7',
    email: 'gestor3@livegenda.com',
    senha: '123456',
    tipo: 'gestor',
    funcionario_id: null,
    empresa_id: '3',
    primeiro_acesso: false
  }
];

// Configuração padrão (será substituída pela configuração da empresa)
export const mockConfiguracaoNegocio = null; // Não usar mais
