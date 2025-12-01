// Use Case de Agendamentos - Orquestra repositórios e serviços
import type { DbClient, AgendamentoCompleto } from '../db/types';
import type { EnvConfig } from '../runtime/types';
import type { InsertAgendamento, Agendamento } from '../../schema';
import { 
  sendAgendamentoConfirmacaoEmail, 
  sendAgendamentoRemarcacaoEmail, 
  sendAgendamentoCancelamentoEmail 
} from '../services/email';
import { 
  sendAgendamentoConfirmacaoSms, 
  sendAgendamentoRemarcacaoSms, 
  sendAgendamentoCancelamentoSms 
} from '../services/sms';

export interface AgendamentoUseCaseDeps {
  db: DbClient;
  env: EnvConfig;
}

export interface CreateAgendamentoResult {
  success: boolean;
  agendamento?: Agendamento;
  error?: string;
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
  };
}

export interface UpdateAgendamentoResult {
  success: boolean;
  agendamento?: Agendamento;
  error?: string;
  remarcado?: boolean;
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
  };
}

export interface CancelAgendamentoResult {
  success: boolean;
  agendamento?: Agendamento;
  error?: string;
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
  };
}

export function createAgendamentoUseCase(deps: AgendamentoUseCaseDeps) {
  const { db, env } = deps;

  return {
    // Criar novo agendamento
    async criar(data: InsertAgendamento): Promise<CreateAgendamentoResult> {
      try {
        // Verificar conflito de horário
        const dataHora = new Date(data.dataHora);
        const dataHoraFim = new Date(data.dataHoraFim);
        
        const temConflito = await db.checkConflito(data.funcionarioId, dataHora, dataHoraFim);
        if (temConflito) {
          return { success: false, error: 'Horário já ocupado para este profissional' };
        }

        // Inserir agendamento
        const agendamento = await db.insertAgendamento(data);

        // Buscar dados completos para notificações
        const completo = await db.findAgendamentoCompleto(agendamento.id);
        
        const notificacoes = { email: false, sms: false };

        if (completo?.cliente && completo?.servico && completo?.funcionario && completo?.empresa) {
          // Enviar email de confirmação
          if (completo.cliente.email) {
            const emailResult = await sendAgendamentoConfirmacaoEmail(env, {
              to: completo.cliente.email,
              clienteNome: completo.cliente.nome,
              empresaNome: completo.empresa.nome,
              funcionarioNome: completo.funcionario.nome,
              servicoNome: completo.servico.nome,
              dataHora: new Date(agendamento.dataHora),
              duracaoMinutos: completo.servico.duracaoMinutos,
              preco: agendamento.precoFinal || completo.servico.preco,
              empresaTelefone: completo.empresa.telefone,
              empresaEndereco: completo.empresa.endereco,
            });
            notificacoes.email = emailResult.success;
          }

          // Enviar SMS de confirmação
          if (completo.cliente.telefone) {
            const smsResult = await sendAgendamentoConfirmacaoSms(env, {
              to: completo.cliente.telefone,
              clienteNome: completo.cliente.nome,
              empresaNome: completo.empresa.nome,
              funcionarioNome: completo.funcionario.nome,
              servicoNome: completo.servico.nome,
              dataHora: new Date(agendamento.dataHora),
              preco: agendamento.precoFinal || completo.servico.preco,
            });
            notificacoes.sms = smsResult.success;
          }
        }

        return { success: true, agendamento, notificacoes };
      } catch (error) {
        console.error('[UseCase] Erro ao criar agendamento:', error);
        return { success: false, error: 'Erro interno ao criar agendamento' };
      }
    },

    // Atualizar agendamento (pode ser remarcação)
    async atualizar(id: string, data: Partial<InsertAgendamento>): Promise<UpdateAgendamentoResult> {
      try {
        // Buscar agendamento atual
        const atual = await db.findAgendamentoCompleto(id);
        if (!atual) {
          return { success: false, error: 'Agendamento não encontrado' };
        }

        // Se está alterando data/hora, verificar conflito
        let remarcado = false;
        if (data.dataHora || data.dataHoraFim) {
          const novaDataHora = data.dataHora ? new Date(data.dataHora) : new Date(atual.dataHora);
          const novaDataHoraFim = data.dataHoraFim ? new Date(data.dataHoraFim) : new Date(atual.dataHoraFim);
          const funcionarioId = data.funcionarioId || atual.funcionarioId;

          const temConflito = await db.checkConflito(funcionarioId, novaDataHora, novaDataHoraFim, id);
          if (temConflito) {
            return { success: false, error: 'Horário já ocupado para este profissional' };
          }

          // Verificar se é remarcação (data/hora diferente)
          const dataHoraAtual = new Date(atual.dataHora).getTime();
          const dataHoraNova = novaDataHora.getTime();
          remarcado = dataHoraAtual !== dataHoraNova;
        }

        // Atualizar agendamento
        const agendamento = await db.updateAgendamento(id, data);
        if (!agendamento) {
          return { success: false, error: 'Falha ao atualizar agendamento' };
        }

        const notificacoes = { email: false, sms: false };

        // Se foi remarcado, enviar notificações
        if (remarcado && atual.cliente && atual.servico && atual.funcionario && atual.empresa) {
          const dataHoraAnterior = new Date(atual.dataHora);
          const dataHoraNova = new Date(agendamento.dataHora);

          // Email de remarcação
          if (atual.cliente.email) {
            const emailResult = await sendAgendamentoRemarcacaoEmail(env, {
              to: atual.cliente.email,
              clienteNome: atual.cliente.nome,
              empresaNome: atual.empresa.nome,
              funcionarioNome: atual.funcionario.nome,
              servicoNome: atual.servico.nome,
              dataHoraAnterior,
              dataHoraNova,
              empresaTelefone: atual.empresa.telefone,
              empresaEndereco: atual.empresa.endereco,
            });
            notificacoes.email = emailResult.success;
          }

          // SMS de remarcação
          if (atual.cliente.telefone) {
            const smsResult = await sendAgendamentoRemarcacaoSms(env, {
              to: atual.cliente.telefone,
              clienteNome: atual.cliente.nome,
              empresaNome: atual.empresa.nome,
              funcionarioNome: atual.funcionario.nome,
              servicoNome: atual.servico.nome,
              dataHoraAnterior,
              dataHoraNova,
            });
            notificacoes.sms = smsResult.success;
          }
        }

        return { success: true, agendamento, remarcado, notificacoes };
      } catch (error) {
        console.error('[UseCase] Erro ao atualizar agendamento:', error);
        return { success: false, error: 'Erro interno ao atualizar agendamento' };
      }
    },

    // Cancelar agendamento
    async cancelar(id: string, motivo?: string): Promise<CancelAgendamentoResult> {
      try {
        // Buscar agendamento atual com dados completos
        const atual = await db.findAgendamentoCompleto(id);
        if (!atual) {
          return { success: false, error: 'Agendamento não encontrado' };
        }

        // Atualizar status para cancelado
        const agendamento = await db.updateAgendamento(id, { status: 'cancelado' });
        if (!agendamento) {
          return { success: false, error: 'Falha ao cancelar agendamento' };
        }

        const notificacoes = { email: false, sms: false };

        // Enviar notificações de cancelamento
        if (atual.cliente && atual.servico && atual.funcionario && atual.empresa) {
          // Email de cancelamento
          if (atual.cliente.email) {
            const emailResult = await sendAgendamentoCancelamentoEmail(env, {
              to: atual.cliente.email,
              clienteNome: atual.cliente.nome,
              empresaNome: atual.empresa.nome,
              funcionarioNome: atual.funcionario.nome,
              servicoNome: atual.servico.nome,
              dataHora: new Date(atual.dataHora),
              motivoCancelamento: motivo,
              empresaTelefone: atual.empresa.telefone,
            });
            notificacoes.email = emailResult.success;
          }

          // SMS de cancelamento
          if (atual.cliente.telefone) {
            const smsResult = await sendAgendamentoCancelamentoSms(env, {
              to: atual.cliente.telefone,
              clienteNome: atual.cliente.nome,
              empresaNome: atual.empresa.nome,
              servicoNome: atual.servico.nome,
              dataHora: new Date(atual.dataHora),
              empresaTelefone: atual.empresa.telefone,
            });
            notificacoes.sms = smsResult.success;
          }
        }

        return { success: true, agendamento, notificacoes };
      } catch (error) {
        console.error('[UseCase] Erro ao cancelar agendamento:', error);
        return { success: false, error: 'Erro interno ao cancelar agendamento' };
      }
    },

    // Buscar agendamento por ID
    async buscarPorId(id: string): Promise<AgendamentoCompleto | undefined> {
      return db.findAgendamentoCompleto(id);
    },

    // Listar agendamentos da empresa (simples)
    async listarPorEmpresa(empresaId: string, filters?: {
      clienteId?: string;
      funcionarioId?: string;
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }): Promise<Agendamento[]> {
      return db.findAgendamentosByEmpresa(empresaId, filters);
    },

    // Listar agendamentos da empresa com dados relacionados
    async listarCompletosPorEmpresa(empresaId: string, filters?: {
      clienteId?: string;
      funcionarioId?: string;
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }): Promise<AgendamentoCompleto[]> {
      return db.findAgendamentosCompletosByEmpresa(empresaId, filters);
    }
  };
}
