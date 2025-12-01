import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

// IDs dos templates criados no Resend
const TEMPLATE_BOAS_VINDAS_FUNCIONARIO = 'a41dab54-a2a0-4a87-beb1-1ea82f9fd5df';
const TEMPLATE_CONFIRMACAO_AGENDAMENTO = '272e5242-b0fc-484d-a095-93e711b62848';

// ============ EMAIL DE BOAS-VINDAS ============

interface SendWelcomeEmailParams {
  to: string;
  funcionarioNome: string;
  empresaNome: string;
  loginUrl?: string;
}

export async function sendWelcomeEmail({ to, funcionarioNome, empresaNome, loginUrl = 'https://app.livegenda.com' }: SendWelcomeEmailParams) {
  try {
    console.log('[Email Boas-Vindas] Iniciando envio para:', to);
    console.log('[Email Boas-Vindas] Template ID:', TEMPLATE_BOAS_VINDAS_FUNCIONARIO);
    
    const templateVariables = {
      FUNC_NOME: String(funcionarioNome || 'Profissional'),
      EMPRESA_NOME: String(empresaNome || 'Empresa'),
      USER_EMAIL: String(to),
      LOGIN_URL: String(loginUrl),
    };
    
    console.log('[Email Boas-Vindas] Variables:', JSON.stringify(templateVariables, null, 2));
    
    // Formato correto do Resend: template: { id, variables }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Livegenda <noreply@livegenda.com>',
        to: [to],
        template: {
          id: TEMPLATE_BOAS_VINDAS_FUNCIONARIO,
          variables: templateVariables,
        },
      }),
    });

    const result = await response.json();
    console.log('[Email Boas-Vindas] Response status:', response.status);
    console.log('[Email Boas-Vindas] Response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('[Email Boas-Vindas] Erro:', result);
      return { success: false, error: result };
    }

    console.log('[Email Boas-Vindas] Enviado com sucesso:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Boas-Vindas] Erro:', error);
    return { success: false, error };
  }
}

// ============ EMAIL DE CONFIRMAÇÃO DE AGENDAMENTO ============

interface SendAgendamentoConfirmacaoEmailParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  funcionarioNome: string;
  servicoNome: string;
  dataHora: Date;
  duracaoMinutos: number;
  preco: string;
  empresaTelefone?: string | null;
  empresaEndereco?: string | null;
}

export async function sendAgendamentoConfirmacaoEmail(params: SendAgendamentoConfirmacaoEmailParams) {
  try {
    const { to, clienteNome, empresaNome, funcionarioNome, servicoNome, dataHora, duracaoMinutos, preco, empresaTelefone, empresaEndereco } = params;
    
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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
    
    console.log('[Email Confirmação] Iniciando envio para:', to);
    console.log('[Email Confirmação] Template ID:', TEMPLATE_CONFIRMACAO_AGENDAMENTO);
    
    const templateVariables = {
      CLIENTE_NOME: String(clienteNome || 'Cliente'),
      SERVICO_NOME: String(servicoNome || 'Serviço'),
      EMPRESA_NOME: String(empresaNome || 'Empresa'),
      FUNCIONARIO_NOME: String(funcionarioNome || 'Profissional'),
      DATA_FORMATADA: String(dataFormatada),
      HORA_FORMATADA: String(horaFormatada),
      DURACAO_MINUTOS: String(duracaoMinutos || '0'),
      PRECO_FORMATADO: String(precoFormatado),
      EMPRESA_ENDERECO: String(empresaEndereco || 'Não informado'),
      EMPRESA_TELEFONE: String(empresaTelefone || 'Não informado'),
    };
    
    console.log('[Email Confirmação] Variables:', JSON.stringify(templateVariables, null, 2));
    
    // Formato correto do Resend: template: { id, variables }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Livegenda <noreply@livegenda.com>',
        to: [to],
        template: {
          id: TEMPLATE_CONFIRMACAO_AGENDAMENTO,
          variables: templateVariables,
        },
      }),
    });

    const result = await response.json();
    console.log('[Email Confirmação] Response status:', response.status);
    console.log('[Email Confirmação] Response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('[Email Confirmação] Erro:', result);
      return { success: false, error: result };
    }

    console.log('[Email Confirmação] Enviado com sucesso:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Confirmação] Erro:', error);
    return { success: false, error };
  }
}

// ============ EMAIL DE REMARCAÇÃO DE AGENDAMENTO ============

interface SendAgendamentoRemarcacaoEmailParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  funcionarioNome: string;
  servicoNome: string;
  dataHoraAnterior: Date;
  dataHoraNova: Date;
  empresaTelefone?: string | null;
  empresaEndereco?: string | null;
}

export async function sendAgendamentoRemarcacaoEmail(params: SendAgendamentoRemarcacaoEmailParams) {
  try {
    const { to, clienteNome, empresaNome, funcionarioNome, servicoNome, dataHoraAnterior, dataHoraNova, empresaTelefone, empresaEndereco } = params;
    
    const formatarData = (data: Date) => new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(data);
    
    const formatarHora = (data: Date) => new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
    
    const dataAnteriorFormatada = formatarData(dataHoraAnterior);
    const horaAnteriorFormatada = formatarHora(dataHoraAnterior);
    const dataNovaFormatada = formatarData(dataHoraNova);
    const horaNovaFormatada = formatarHora(dataHoraNova);
    
    console.log('[Email Remarcação] Iniciando envio para:', to);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Remarcado - ${empresaNome}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com ícone de remarcação -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">📅</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Agendamento Remarcado</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Seu horário foi alterado</p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                Olá <strong>${clienteNome}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                Seu agendamento em <strong>${empresaNome}</strong> foi remarcado. Confira os detalhes abaixo:
              </p>
              
              <!-- Data Anterior (riscada) -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                <p style="color: #dc2626; font-size: 12px; text-transform: uppercase; font-weight: 600; margin: 0 0 8px;">Data Anterior</p>
                <p style="color: #991b1b; font-size: 16px; margin: 0; text-decoration: line-through;">
                  ${dataAnteriorFormatada} às ${horaAnteriorFormatada}
                </p>
              </div>
              
              <!-- Nova Data -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #16a34a; font-size: 12px; text-transform: uppercase; font-weight: 600; margin: 0 0 8px;">Nova Data</p>
                <p style="color: #15803d; font-size: 18px; font-weight: 600; margin: 0;">
                  ${dataNovaFormatada} às ${horaNovaFormatada}
                </p>
              </div>
              
              <!-- Detalhes do Serviço -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Serviço</span>
                          <span style="color: #111827; font-size: 14px; font-weight: 500; float: right;">${servicoNome}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Profissional</span>
                          <span style="color: #111827; font-size: 14px; font-weight: 500; float: right;">${funcionarioNome}</span>
                        </td>
                      </tr>
                      ${empresaEndereco ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Local</span>
                          <span style="color: #111827; font-size: 14px; font-weight: 500; float: right;">${empresaEndereco}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso -->
              <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6; text-align: center;">
                Caso não possa comparecer no novo horário, entre em contato conosco${empresaTelefone ? ` pelo telefone <strong>${empresaTelefone}</strong>` : ''}.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email foi enviado automaticamente pelo sistema Livegenda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Livegenda <noreply@livegenda.com>',
        to: [to],
        subject: `📅 Agendamento Remarcado - ${empresaNome}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log('[Email Remarcação] Response status:', response.status);

    if (!response.ok) {
      console.error('[Email Remarcação] Erro:', result);
      return { success: false, error: result };
    }

    console.log('[Email Remarcação] Enviado com sucesso:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Remarcação] Erro:', error);
    return { success: false, error };
  }
}

// ============ EMAIL DE CANCELAMENTO DE AGENDAMENTO ============

interface SendAgendamentoCancelamentoEmailParams {
  to: string;
  clienteNome: string;
  empresaNome: string;
  funcionarioNome: string;
  servicoNome: string;
  dataHora: Date;
  motivoCancelamento?: string | null;
  empresaTelefone?: string | null;
}

export async function sendAgendamentoCancelamentoEmail(params: SendAgendamentoCancelamentoEmailParams) {
  try {
    const { to, clienteNome, empresaNome, funcionarioNome, servicoNome, dataHora, motivoCancelamento, empresaTelefone } = params;
    
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dataHora);
    
    const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dataHora);
    
    console.log('[Email Cancelamento] Iniciando envio para:', to);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Cancelado - ${empresaNome}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com ícone de cancelamento -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">❌</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Agendamento Cancelado</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Seu horário foi cancelado</p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                Olá <strong>${clienteNome}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                Informamos que seu agendamento em <strong>${empresaNome}</strong> foi cancelado.
              </p>
              
              <!-- Detalhes do agendamento cancelado -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #991b1b; font-size: 14px; text-transform: uppercase; font-weight: 600; margin: 0 0 16px;">Detalhes do Agendamento Cancelado</h3>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                      <span style="color: #991b1b; font-size: 14px;">Data</span>
                      <span style="color: #7f1d1d; font-size: 14px; font-weight: 500; float: right; text-decoration: line-through;">${dataFormatada}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                      <span style="color: #991b1b; font-size: 14px;">Horário</span>
                      <span style="color: #7f1d1d; font-size: 14px; font-weight: 500; float: right; text-decoration: line-through;">${horaFormatada}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                      <span style="color: #991b1b; font-size: 14px;">Serviço</span>
                      <span style="color: #7f1d1d; font-size: 14px; font-weight: 500; float: right;">${servicoNome}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #991b1b; font-size: 14px;">Profissional</span>
                      <span style="color: #7f1d1d; font-size: 14px; font-weight: 500; float: right;">${funcionarioNome}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${motivoCancelamento ? `
              <!-- Motivo do cancelamento -->
              <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin: 0 0 8px;">Motivo</p>
                <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">
                  ${motivoCancelamento}
                </p>
              </div>
              ` : ''}
              
              <!-- CTA para novo agendamento -->
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px; line-height: 1.6;">
                  Deseja reagendar? Entre em contato conosco!
                </p>
                ${empresaTelefone ? `
                <a href="tel:${empresaTelefone.replace(/\D/g, '')}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  📞 Ligar: ${empresaTelefone}
                </a>
                ` : ''}
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6; text-align: center;">
                Agradecemos sua compreensão e esperamos atendê-lo em breve!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email foi enviado automaticamente pelo sistema Livegenda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Livegenda <noreply@livegenda.com>',
        to: [to],
        subject: `❌ Agendamento Cancelado - ${empresaNome}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log('[Email Cancelamento] Response status:', response.status);

    if (!response.ok) {
      console.error('[Email Cancelamento] Erro:', result);
      return { success: false, error: result };
    }

    console.log('[Email Cancelamento] Enviado com sucesso:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Cancelamento] Erro:', error);
    return { success: false, error };
  }
}

// ============ FUNÇÃO DE TESTE DE EMAIL ============

export async function testWelcomeEmail(to: string) {
  return sendWelcomeEmail({
    to,
    funcionarioNome: 'João Silva',
    empresaNome: 'Salão Beleza Total',
    loginUrl: 'https://app.livegenda.com',
  });
}

export async function testConfirmacaoEmail(to: string) {
  return sendAgendamentoConfirmacaoEmail({
    to,
    clienteNome: 'Maria Santos',
    empresaNome: 'Salão Beleza Total',
    funcionarioNome: 'João Silva',
    servicoNome: 'Corte de Cabelo',
    dataHora: new Date(),
    duracaoMinutos: 45,
    preco: '50.00',
    empresaTelefone: '(11) 99999-9999',
    empresaEndereco: 'Rua das Flores, 123 - Centro',
  });
}
