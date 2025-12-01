// Use Case de Funcionários - Orquestra repositórios e serviços
import type { DbClient } from '../db/types';
import type { EnvConfig } from '../runtime/types';
import type { InsertFuncionario, Funcionario } from '../../schema';
import { sendWelcomeEmail } from '../services/email';
import { sendWelcomeSms } from '../services/sms';

export interface FuncionarioUseCaseDeps {
  db: DbClient;
  env: EnvConfig;
}

export interface CreateFuncionarioResult {
  success: boolean;
  funcionario?: Funcionario;
  error?: string;
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
  };
}

export interface UpdateFuncionarioResult {
  success: boolean;
  funcionario?: Funcionario;
  error?: string;
}

export function createFuncionarioUseCase(deps: FuncionarioUseCaseDeps) {
  const { db, env } = deps;

  return {
    // Criar novo funcionário
    async criar(data: InsertFuncionario): Promise<CreateFuncionarioResult> {
      try {
        // Verificar unicidade global de email
        if (data.email) {
          const emailExiste = await db.checkFuncionarioEmailExists(data.email);
          if (emailExiste) {
            // Verificar também em clientes
            const emailClienteExiste = await db.checkClienteEmailExists(data.email);
            if (emailExiste || emailClienteExiste) {
              return { success: false, error: 'Email já cadastrado no sistema' };
            }
          }
        }

        // Verificar unicidade global de telefone
        if (data.telefone) {
          const telefoneExiste = await db.checkFuncionarioTelefoneExists(data.telefone);
          if (telefoneExiste) {
            const telefoneClienteExiste = await db.checkClienteTelefoneExists(data.telefone);
            if (telefoneExiste || telefoneClienteExiste) {
              return { success: false, error: 'Telefone já cadastrado no sistema' };
            }
          }
        }

        // Buscar empresa para notificações
        const empresa = await db.findEmpresaById(data.empresaId);
        if (!empresa) {
          return { success: false, error: 'Empresa não encontrada' };
        }

        // Inserir funcionário
        const funcionario = await db.insertFuncionario(data);

        const notificacoes = { email: false, sms: false };

        // Enviar email de boas-vindas
        if (funcionario.email) {
          const emailResult = await sendWelcomeEmail(env, {
            to: funcionario.email,
            funcionarioNome: funcionario.nome,
            empresaNome: empresa.nome,
          });
          notificacoes.email = emailResult.success;
        }

        // Enviar SMS de boas-vindas
        if (funcionario.telefone) {
          const smsResult = await sendWelcomeSms(env, {
            to: funcionario.telefone,
            funcionarioNome: funcionario.nome,
            empresaNome: empresa.nome,
          });
          notificacoes.sms = smsResult.success;
        }

        return { success: true, funcionario, notificacoes };
      } catch (error) {
        console.error('[UseCase] Erro ao criar funcionário:', error);
        return { success: false, error: 'Erro interno ao criar funcionário' };
      }
    },

    // Atualizar funcionário
    async atualizar(id: string, data: Partial<InsertFuncionario>): Promise<UpdateFuncionarioResult> {
      try {
        // Verificar unicidade de email
        if (data.email) {
          const emailExiste = await db.checkFuncionarioEmailExists(data.email, id);
          const emailClienteExiste = await db.checkClienteEmailExists(data.email);
          if (emailExiste || emailClienteExiste) {
            return { success: false, error: 'Email já cadastrado no sistema' };
          }
        }

        // Verificar unicidade de telefone
        if (data.telefone) {
          const telefoneExiste = await db.checkFuncionarioTelefoneExists(data.telefone, id);
          const telefoneClienteExiste = await db.checkClienteTelefoneExists(data.telefone);
          if (telefoneExiste || telefoneClienteExiste) {
            return { success: false, error: 'Telefone já cadastrado no sistema' };
          }
        }

        const funcionario = await db.updateFuncionario(id, data);
        if (!funcionario) {
          return { success: false, error: 'Funcionário não encontrado' };
        }

        return { success: true, funcionario };
      } catch (error) {
        console.error('[UseCase] Erro ao atualizar funcionário:', error);
        return { success: false, error: 'Erro interno ao atualizar funcionário' };
      }
    },

    // Buscar funcionário por ID
    async buscarPorId(id: string): Promise<Funcionario | undefined> {
      return db.findFuncionarioById(id);
    },

    // Listar funcionários da empresa
    async listarPorEmpresa(empresaId: string, apenasAtivos: boolean = true): Promise<Funcionario[]> {
      return db.findFuncionariosByEmpresa(empresaId, apenasAtivos ? true : undefined);
    },

    // Desativar funcionário
    async desativar(id: string): Promise<UpdateFuncionarioResult> {
      return this.atualizar(id, { ativo: false });
    },

    // Ativar funcionário
    async ativar(id: string): Promise<UpdateFuncionarioResult> {
      return this.atualizar(id, { ativo: true });
    }
  };
}
