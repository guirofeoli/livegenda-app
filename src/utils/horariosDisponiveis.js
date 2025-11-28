// Utilitário para calcular horários disponíveis baseado em:
// - Horário de funcionamento da empresa
// - Agendamentos já existentes do funcionário
// - Duração do serviço

/**
 * Converte string de hora "HH:MM" para minutos desde meia-noite
 */
const horaParaMinutos = (hora) => {
  if (!hora) return 0;
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
 * @param {object} configuracao - Configuração do negócio
 * @param {array} agendamentos - Lista de agendamentos existentes
 * @returns {array} Array de strings com horários disponíveis "HH:MM"
 */
export const getHorariosDisponiveis = (funcionarioId, data, duracaoServico, configuracao, agendamentos) => {
  if (!configuracao || !funcionarioId || !data || !duracaoServico) {
    return [];
  }

  // 1. Obter horário de funcionamento do dia
  const diaSemana = getDiaSemana(data);
  const horarioEmpresa = configuracao.horario_funcionamento?.[diaSemana] || 
                         configuracao.horarioFuncionamento?.[diaSemana];
  
  if (!horarioEmpresa || !horarioEmpresa.ativo) {
    return []; // Empresa fechada neste dia
  }

  // Suportar ambos formatos de campos (abertura/fechamento ou inicio/fim)
  const abertura = horarioEmpresa.abertura || horarioEmpresa.inicio;
  const fechamento = horarioEmpresa.fechamento || horarioEmpresa.fim;

  const inicioEmpresa = horaParaMinutos(abertura);
  const fimEmpresa = horaParaMinutos(fechamento);
  
  // Intervalo entre slots (padrão 30 minutos)
  const intervalo = configuracao.intervaloAgendamento || 30;

  // 2. Filtrar agendamentos do funcionário neste dia
  const agendamentosDia = (agendamentos || []).filter(ag => 
    ag.funcionario_id === funcionarioId && 
    ag.data === data &&
    ag.status !== 'Cancelado'
  );

  // 3. Criar array de horários ocupados (em minutos)
  const horariosOcupados = [];
  agendamentosDia.forEach(ag => {
    const inicio = horaParaMinutos(ag.hora_inicio);
    const fim = inicio + (ag.duracao_minutos || 30);
    
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
  if (!configuracao) return false;
  
  const diaSemana = getDiaSemana(data);
  const horarioEmpresa = configuracao.horario_funcionamento?.[diaSemana] || 
                         configuracao.horarioFuncionamento?.[diaSemana];
  
  return horarioEmpresa && horarioEmpresa.ativo;
};

/**
 * Retorna o horário de funcionamento de um dia específico
 */
export const getHorarioEmpresa = (data, configuracao) => {
  if (!configuracao) return null;
  
  const diaSemana = getDiaSemana(data);
  return configuracao.horario_funcionamento?.[diaSemana] || 
         configuracao.horarioFuncionamento?.[diaSemana];
};
