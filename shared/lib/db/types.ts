// Tipos para abstração do cliente de banco de dados
import type { 
  Empresa, InsertEmpresa,
  Usuario, InsertUsuario,
  Funcionario, InsertFuncionario,
  Cliente, InsertCliente,
  Servico, InsertServico,
  Agendamento, InsertAgendamento
} from '../../schema';

// Interface abstrata para operações de banco
export interface DbClient {
  // Empresas
  findEmpresaById(id: string): Promise<Empresa | undefined>;
  findEmpresaBySlug(slug: string): Promise<Empresa | undefined>;
  findEmpresas(ativo?: boolean): Promise<Empresa[]>;
  insertEmpresa(data: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: string, data: Partial<InsertEmpresa>): Promise<Empresa | undefined>;
  
  // Usuários
  findUsuarioById(id: string): Promise<Usuario | undefined>;
  findUsuarioByEmail(email: string): Promise<Usuario | undefined>;
  findUsuariosByEmpresa(empresaId: string): Promise<Usuario[]>;
  insertUsuario(data: InsertUsuario): Promise<Usuario>;
  updateUsuario(id: string, data: Partial<InsertUsuario>): Promise<Usuario | undefined>;
  
  // Funcionários
  findFuncionarioById(id: string): Promise<Funcionario | undefined>;
  findFuncionariosByEmpresa(empresaId: string, ativo?: boolean): Promise<Funcionario[]>;
  insertFuncionario(data: InsertFuncionario): Promise<Funcionario>;
  updateFuncionario(id: string, data: Partial<InsertFuncionario>): Promise<Funcionario | undefined>;
  checkFuncionarioEmailExists(email: string, excludeId?: string): Promise<boolean>;
  checkFuncionarioTelefoneExists(telefone: string, excludeId?: string): Promise<boolean>;
  
  // Clientes
  findClienteById(id: string): Promise<Cliente | undefined>;
  findClientesByEmpresa(empresaId: string, ativo?: boolean): Promise<Cliente[]>;
  insertCliente(data: InsertCliente): Promise<Cliente>;
  updateCliente(id: string, data: Partial<InsertCliente>): Promise<Cliente | undefined>;
  checkClienteEmailExists(email: string, excludeId?: string): Promise<boolean>;
  checkClienteTelefoneExists(telefone: string, excludeId?: string): Promise<boolean>;
  
  // Serviços
  findServicoById(id: string): Promise<Servico | undefined>;
  findServicosByEmpresa(empresaId: string, ativo?: boolean): Promise<Servico[]>;
  insertServico(data: InsertServico): Promise<Servico>;
  updateServico(id: string, data: Partial<InsertServico>): Promise<Servico | undefined>;
  
  // Agendamentos
  findAgendamentoById(id: string): Promise<Agendamento | undefined>;
  findAgendamentosByEmpresa(empresaId: string, filters?: AgendamentoFilters): Promise<Agendamento[]>;
  findAgendamentosCompletosByEmpresa(empresaId: string, filters?: AgendamentoFilters): Promise<AgendamentoCompleto[]>;
  findAgendamentoCompleto(id: string): Promise<AgendamentoCompleto | undefined>;
  insertAgendamento(data: InsertAgendamento): Promise<Agendamento>;
  updateAgendamento(id: string, data: Partial<InsertAgendamento>): Promise<Agendamento | undefined>;
  checkConflito(funcionarioId: string, dataHora: Date, dataHoraFim: Date, excludeId?: string): Promise<boolean>;
}

export interface AgendamentoFilters {
  clienteId?: string;
  funcionarioId?: string;
  status?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface AgendamentoCompleto extends Agendamento {
  cliente?: Cliente;
  funcionario?: Funcionario;
  servico?: Servico;
  empresa?: Empresa;
}
