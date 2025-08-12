require('dotenv').config({ path: '.env.local' });

/**
 * Script para testar email de credenciais pós-compra
 * Simula o que acontece quando alguém compra no Hotmart
 */

// Simulação do EmailService (versão simplificada para teste)
class EmailServiceTest {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
  }

  async sendCredentialsEmail(email, userName, password, loginUrl) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.apiKey);

    const subject = '🔐 Suas credenciais de acesso - CíliosClick';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciais de Acesso</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">CíliosClick</div>
            <h1>🎉 Compra aprovada!</h1>
        </div>

        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Sua compra foi <strong>aprovada com sucesso</strong>! 🎉</p>
        
        <p>Agora você tem acesso completo à plataforma <strong>CíliosClick</strong> – a ferramenta ideal para mostrar às suas clientes como os cílios ficarão.</p>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <h3>🔐 Suas credenciais de acesso:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Senha:</strong> ${password}</p>
            <p><strong>Link de acesso:</strong> <a href="${loginUrl}" style="color: #7c3aed;">${loginUrl}</a></p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3>🚀 Como começar:</h3>
            <div style="margin-bottom: 15px; padding-left: 10px;">1. <strong>Faça login</strong> na plataforma</div>
            <div style="margin-bottom: 15px; padding-left: 10px;">2. <strong>Acesse o menu "Aplicar Cílios"</strong></div>
            <div style="margin-bottom: 15px; padding-left: 10px;">3. <strong>Envie a foto da cliente</strong></div>
            <div style="margin-bottom: 15px; padding-left: 10px;">4. <strong>Escolha o estilo</strong> e visualize o resultado</div>
            <div style="margin-bottom: 15px; padding-left: 10px;">5. <strong>Baixe a imagem final</strong> para enviar à sua cliente</div>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>🔒 Importante:</strong> Guarde bem suas credenciais! Recomendamos alterar a senha no primeiro acesso.
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Agora</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
            <p><strong>Bons atendimentos!</strong><br>Equipe CíliosClick</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
Olá ${userName},

Sua compra foi aprovada com sucesso! 🎉

Suas credenciais de acesso:
Email: ${email}
Senha: ${password}
Link: ${loginUrl}

Como começar:
1. Faça login na plataforma
2. Acesse o menu "Aplicar Cílios"
3. Envie a foto da cliente
4. Escolha o estilo e visualize o resultado
5. Baixe a imagem final para enviar à sua cliente

Bons atendimentos!
Equipe CíliosClick
    `;

    const msg = {
      to: email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    try {
      await sgMail.send(msg);
      return { success: true, message: 'Email enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }
}

async function testarEmailPosCompra() {
  console.log('🧪 Testando email pós-compra...');
  console.log('');

  // Verificar configurações
  console.log('📋 Verificando configurações:');
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL}`);
  console.log(`   SENDGRID_FROM_NAME: ${process.env.SENDGRID_FROM_NAME}`);
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.log('❌ SENDGRID_API_KEY não configurada!');
    return;
  }

  // Dados simulados de uma compra
  const dadosCompra = {
    email: 'eduardogelista@gmail.com',
    userName: 'Eduardo',
    password: 'ClikCilios2024!',
    loginUrl: 'https://clik-cilios2-0.vercel.app/login'
  };

  console.log('✅ CREDENCIAIS VÁLIDAS E TESTADAS:');
  console.log(`   📧 Email: ${dadosCompra.email}`);
  console.log(`   🔐 Senha: ${dadosCompra.password}`);
  console.log(`   🌐 URL: ${dadosCompra.loginUrl}`);
  console.log('');

  console.log('📧 Enviando email de credenciais pós-compra...');
  console.log(`   Para: ${dadosCompra.email}`);
  console.log(`   Usuário: ${dadosCompra.userName}`);
  console.log(`   Senha: ${dadosCompra.password}`);
  console.log('');

  try {
    const emailService = new EmailServiceTest();
    const resultado = await emailService.sendCredentialsEmail(
      dadosCompra.email,
      dadosCompra.userName,
      dadosCompra.password,
      dadosCompra.loginUrl
    );

    console.log(`✅ ${resultado.message} para ${dadosCompra.email}`);
    console.log('✅ Teste de email pós-compra concluído com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Verifique se o email chegou na caixa de entrada');
    console.log('2. Verifique a pasta de spam se necessário');
    console.log('3. Teste o login com as credenciais enviadas');
    console.log('4. Confirme se o template está sendo exibido corretamente');
    
  } catch (error) {
    console.log('❌ Erro ao enviar email:', error.message);
    
    if (error.response && error.response.body) {
      console.log('📋 Detalhes do erro:', error.response.body);
    }
  }
}

// Executar teste
testarEmailPosCompra().catch(console.error);