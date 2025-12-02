import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

const welcomeFuncionarioTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bem-vindo ao Livegenda</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 30px 20px !important; }
      .header { padding: 30px 20px !important; }
      .footer { padding: 20px !important; }
      .button { width: 100% !important; display: block !important; }
      h1 { font-size: 24px !important; }
      h2 { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header com gradiente -->
          <tr>
            <td class="header" align="center" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%); padding: 50px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-block; line-height: 70px;">
                      <span style="font-size: 36px; color: #ffffff;">&#128197;</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Livegenda</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">Sistema de Agendamento Inteligente</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Conteúdo principal -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 10px; font-size: 26px; font-weight: 700; color: #111827;">
                      Olá, {{{NOME}}}!
                    </h2>
                    <p style="margin: 0 0 30px; font-size: 18px; color: #6b7280; line-height: 1.6;">
                      Seja muito bem-vindo(a) à equipe!
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Card de destaque -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 25px; border-left: 4px solid #7c3aed;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.7;">
                      Você foi cadastrado(a) como profissional em <strong style="color: #7c3aed;">{{{EMPRESA}}}</strong>. 
                      Agora você pode gerenciar sua agenda, confirmar agendamentos e acompanhar seus atendimentos.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Funcionalidades -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 35px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827;">
                      O que você pode fazer:
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 44px; vertical-align: top;">
                                <div style="width: 36px; height: 36px; background-color: #ede9fe; border-radius: 8px; text-align: center; line-height: 36px;">
                                  <span style="font-size: 18px;">&#128198;</span>
                                </div>
                              </td>
                              <td style="vertical-align: middle; padding-left: 12px;">
                                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">Ver sua agenda de atendimentos</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 44px; vertical-align: top;">
                                <div style="width: 36px; height: 36px; background-color: #ede9fe; border-radius: 8px; text-align: center; line-height: 36px;">
                                  <span style="font-size: 18px;">&#9989;</span>
                                </div>
                              </td>
                              <td style="vertical-align: middle; padding-left: 12px;">
                                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">Confirmar ou remarcar agendamentos</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 44px; vertical-align: top;">
                                <div style="width: 36px; height: 36px; background-color: #ede9fe; border-radius: 8px; text-align: center; line-height: 36px;">
                                  <span style="font-size: 18px;">&#128101;</span>
                                </div>
                              </td>
                              <td style="vertical-align: middle; padding-left: 12px;">
                                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">Acessar dados dos clientes</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 44px; vertical-align: top;">
                                <div style="width: 36px; height: 36px; background-color: #ede9fe; border-radius: 8px; text-align: center; line-height: 36px;">
                                  <span style="font-size: 18px;">&#128200;</span>
                                </div>
                              </td>
                              <td style="vertical-align: middle; padding-left: 12px;">
                                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">Acompanhar seu desempenho</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Botão CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px;">
                <tr>
                  <td align="center">
                    <a href="{{{LOGIN_URL}}}" class="button" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.4);">
                      Acessar Livegenda
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f5ff; border-radius: 8px; border-left: 4px solid #9333ea;">
                    <p style="margin: 0; font-size: 14px; color: #6b21a8;">
                      <strong>Primeiro acesso?</strong><br>
                      Use seu email <strong>{{{USER_EMAIL}}}</strong> para fazer login. Você será guiado pelo processo de configuração inicial.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Texto auxiliar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 25px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                      Se o botão não funcionar, copie e cole este link no navegador:<br>
                      <a href="{{{LOGIN_URL}}}" style="color: #7c3aed; text-decoration: underline;">{{{LOGIN_URL}}}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #e5e7eb;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 30px 40px; background-color: #fafafa;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                      Este email foi enviado automaticamente pelo Livegenda.
                    </p>
                    <p style="margin: 0 0 15px; font-size: 12px; color: #9ca3af;">
                      Você recebeu este email porque foi cadastrado como profissional em {{{EMPRESA}}}.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      © 2024 Livegenda. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;

async function createTemplates() {
  console.log('Criando templates de email no Resend...\n');

  try {
    // Primeiro, verificar se já existe o template
    const templates = await resend.templates.list();
    console.log('Templates existentes:', templates.data?.data?.map(t => t.name) || []);

    const existingTemplate = templates.data?.data?.find(t => t.name === 'boas-vindas-funcionario');
    
    if (existingTemplate) {
      console.log('\n⚠️  Template "boas-vindas-funcionario" já existe. Atualizando...');
      
      // Atualizar template existente
      const { data, error } = await resend.templates.update({
        id: existingTemplate.id,
        html: welcomeFuncionarioTemplate,
      });

      if (error) {
        console.error('Erro ao atualizar template:', error);
        return;
      }

      console.log('✅ Template atualizado com sucesso!');
      console.log('   ID:', existingTemplate.id);
    } else {
      // Criar novo template
      const { data, error } = await resend.templates.create({
        name: 'boas-vindas-funcionario',
        html: welcomeFuncionarioTemplate,
        variables: [
          {
            key: 'NOME',
            type: 'string',
            fallbackValue: 'Profissional',
          },
          {
            key: 'EMPRESA',
            type: 'string',
            fallbackValue: 'Sua Empresa',
          },
          {
            key: 'USER_EMAIL',
            type: 'string',
            fallbackValue: 'email@exemplo.com',
          },
          {
            key: 'LOGIN_URL',
            type: 'string',
            fallbackValue: 'https://app.livegenda.com',
          },
        ],
      });

      if (error) {
        console.error('Erro ao criar template:', error);
        return;
      }

      console.log('✅ Template "boas-vindas-funcionario" criado com sucesso!');
      console.log('   ID:', data?.id);

      // Publicar o template (se necessário)
      // await resend.templates.publish({ id: data?.id });
    }

    console.log('\n📧 Template pronto para uso!');
    console.log('   Use o ID do template para enviar emails com resend.emails.send()');

  } catch (error) {
    console.error('Erro:', error);
  }
}

createTemplates();
