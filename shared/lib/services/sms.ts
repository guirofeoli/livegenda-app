// Serviço de SMS via Infobip - Compatível com Node.js e Cloudflare Workers
import type { EnvConfig, SmsResult } from '../runtime/types';

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

async function sendSms(env: EnvConfig, to: string, message: string, from: string = 'Livegenda'): Promise<SmsResult> {
  if (!env.INFOBIP_API || !env.INFOBIP_BASE_URL) {
    console.error('[SMS] Credenciais Infobip não configuradas');
    return { success: false, error: 'Credenciais não configuradas' };
  }

  const phoneNumber = formatPhoneNumber(to);
  
  try {
    console.log(`[SMS] Enviando para ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    const url = `https://${env.INFOBIP_BASE_URL}/sms/2/text/advanced`;
    
    const payload = {
      messages: [{
        destinations: [{ to: phoneNumber }],
        from,
        text: message
      }]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${env.INFOBIP_API}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as any;
    
    if (response.ok) {
      const messageId = result.messages?.[0]?.messageId;
      const status = result.messages?.[0]?.status?.name;
      console.log(`[SMS] Enviado com sucesso! ID: ${messageId}, Status: ${status}`);
      return { success: true, messageId };
    } else {
      console.error('[SMS] Erro:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('[SMS] Erro ao enviar:', error);
    return { success: false, error };
  }
}

// ============ SMS DE BOAS-VINDAS FUNCIONÁRIO ============

interface SendWelcomeSmsParams {
  to: string;
  funcionarioNome: string;
  empresaNome: string;
}

export async function sendWelcomeSms(env: EnvConfig, { to, funcionarioNome, empresaNome }: SendWelcomeSmsParams): Promise<SmsResult> {
  const message = `Olá ${funcionarioNome}! Bem-vindo(a) à equipe ${empresaNome} no Livegenda. Acesse app.livegenda.com para gerenciar sua agenda.`;
  return sendSms(env, to, message);
}

// ============ SMS DE CONFIRMAÇÃO DE AGENDAMENTO ============

interface SendAgendamentoConfirmacaoSmsParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  funcionarioNome: string;
  servicoNome: string;
  dataHora: Date;
  preco: string;
}

export async function sendAgendamentoConfirmacaoSms(env: EnvConfig, params: SendAgendamentoConfirmacaoSmsParams): Promise<SmsResult> {
  const { to, clienteNome, empresaNome, funcionarioNome, servicoNome, dataHora, preco } = params;
  
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dataHora);
  
  const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dataHora);
  
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(preco));
  
  const message = `${clienteNome}, seu agendamento está confirmado! ${servicoNome} com ${funcionarioNome} em ${dataFormatada} às ${horaFormatada}. Valor: ${precoFormatado}. ${empresaNome}`;
  
  return sendSms(env, to, message);
}

// ============ SMS DE CÓDIGO OTP ============

interface SendOtpSmsParams {
  to: string;
  codigo: string;
  empresaNome: string;
}

export async function sendOtpSms(env: EnvConfig, { to, codigo, empresaNome }: SendOtpSmsParams): Promise<SmsResult> {
  const message = `Seu código de verificação ${empresaNome}: ${codigo}. Válido por 10 minutos. Não compartilhe este código.`;
  return sendSms(env, to, message);
}

// ============ SMS DE REMARCAÇÃO DE AGENDAMENTO ============

interface SendAgendamentoRemarcacaoSmsParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  funcionarioNome: string;
  servicoNome: string;
  dataHoraAnterior: Date;
  dataHoraNova: Date;
}

export async function sendAgendamentoRemarcacaoSms(env: EnvConfig, params: SendAgendamentoRemarcacaoSmsParams): Promise<SmsResult> {
  const { to, clienteNome, empresaNome, funcionarioNome, servicoNome, dataHoraAnterior, dataHoraNova } = params;
  
  const formatarData = (data: Date) => new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(data);
  
  const formatarHora = (data: Date) => new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
  
  const message = `${clienteNome}, seu agendamento foi REMARCADO! De ${formatarData(dataHoraAnterior)} ${formatarHora(dataHoraAnterior)} para ${formatarData(dataHoraNova)} às ${formatarHora(dataHoraNova)}. ${servicoNome} com ${funcionarioNome}. ${empresaNome}`;
  
  return sendSms(env, to, message);
}

// ============ SMS DE CANCELAMENTO DE AGENDAMENTO ============

interface SendAgendamentoCancelamentoSmsParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  servicoNome: string;
  dataHora: Date;
  empresaTelefone?: string | null;
}

export async function sendAgendamentoCancelamentoSms(env: EnvConfig, params: SendAgendamentoCancelamentoSmsParams): Promise<SmsResult> {
  const { to, clienteNome, empresaNome, servicoNome, dataHora, empresaTelefone } = params;
  
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dataHora);
  
  const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dataHora);
  
  const contatoInfo = empresaTelefone ? ` Contato: ${empresaTelefone}` : '';
  
  const message = `${clienteNome}, seu agendamento de ${servicoNome} em ${dataFormatada} às ${horaFormatada} foi CANCELADO.${contatoInfo} ${empresaNome}`;
  
  return sendSms(env, to, message);
}
