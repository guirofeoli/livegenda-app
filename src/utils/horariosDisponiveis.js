// Utilitário para calcular horários disponíveis baseado em:
// - Horário de funcionamento da empresa
// - Agendamentos já existentes do funcionário
// - Duração do serviço

/**
 * Converte string de hora "HH:MM" para minutos desde meia-noite
 */
const horaParaMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Converte minutos desde meia-noite para string "HH:MM"
 */
const minutosParaHora = (minutos) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Retorna o nome do dia da semana em português
 */
const getDiaSemana = (data) => {
  const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const d = new Date(data + 'T00:00:00');
  return diasSemana[d.getDay()];
};

/**
 * Calcula horários disponíveis para um funcionário em uma data específica
 * 
 * @param {string} funcionarioId - ID do funcionário
 * @param {string} data - Data no formato 'YYYY-MM-DD'
 * @param {number} duracaoServico - Duração do serviço em minutos
 * @param {object} configuracao - Configuração do negócio com horarioFuncionamento
 * @param {array} agendamentos - Lista de todos os agendamentos
 * @returns {array} - Array de horários disponíveis no formato "HH:MM"
 */
export const getHorariosDisponiveis = (
  funcionarioId,
  data,
  duracaoServico,
  configuracao,
  agendamentos
) => {
  // 1. Verificar se a empresa funciona neste dia
  const diaSemana = getDiaSemana(data);
  const horarioEmpresa = configuracao.horarioFuncionamento[diaSemana];
  
  if (!horarioEmpresa || !horarioEmpresa.ativo) {
    return []; // Empresa fechada neste dia
  }

  const inicioEmpresa = horaParaMinutos(horarioEmpresa.inicio);
  const fimEmpresa = horaParaMinutos(horarioEmpresa.fim);
  const intervalo = configuracao.intervaloAgendamento || 30; // Padrão 30 minutos

  // 2. Buscar agendamentos do funcionário nesta data
  const agendamentosDia = agendamentos.filter(
    ag => ag.funcionario_id === funcionarioId && ag.data === data
  );

  // 3. Criar array de horários ocupados (em minutos)
  const horariosOcupados = [];
  agendamentosDia.forEach(ag => {
    const inicio = horaParaMinutos(ag.hora_inicio);
    const fim = inicio + ag.duracao_minutos;
    
    // Marcar todos os minutos ocupados
    for (let m = inicio; m < fim; m++) {
      horariosOcupados.push(m);
    }
  });

  // 4. Gerar todos os slots possíveis
  const slotsDisponiveis = [];
  
  for (let minuto = inicioEmpresa; minuto + duracaoServico <= fimEmpresa; minuto += intervalo) {
    // Verificar se o slot está livre
    let slotLivre = true;
    
    for (let m = minuto; m < minuto + duracaoServico; m++) {
      if (horariosOcupados.includes(m)) {
        slotLivre = false;
        break;
      }
    }
    
    if (slotLivre) {
      slotsDisponiveis.push(minutosParaHora(minuto));
    }
  }

  return slotsDisponiveis;
};

/**
 * Verifica se um dia está ativo no horário de funcionamento
 */
export const isDiaAtivo = (data, configuracao) => {
  const diaSemana = getDiaSemana(data);
  const horarioEmpresa = configuracao.horarioFuncionamento[diaSemana];
  return horarioEmpresa && horarioEmpresa.ativo;
};

/**
 * Retorna o horário de funcionamento de um dia específico
 */
export const getHorarioEmpresa = (data, configuracao) => {
  const diaSemana = getDiaSemana(data);
  return configuracao.horarioFuncionamento[diaSemana];
};
