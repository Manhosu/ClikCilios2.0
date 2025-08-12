const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Simulação do EmailService para teste
class EmailService {
  static apiKey = process.env.SENDGRID_API_KEY;
  static fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@ciliosclick.com';
  static fromName = process.env.SENDGRID_FROM_NAME || 'CíliosClick';

  static async sendEmail(options) {
    if (!this.apiKey) {
      console.error('❌ SENDGRID_API_KEY não configurada');
      return false;
    }

    try {
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: 'text/plain',
              value: options.textContent,
            },
            {
              type: 'text/html',
              value: options.htmlContent,
            },
          ],
        }),
      });

      if (response.ok) {
        console.log(`✅ Email enviado com sucesso para ${options.to}`);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`❌ Erro ao enviar email:`, response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  static async sendCredentialsEmail(email, userName, password, loginUrl = 'https://ciliosclick.com/login') {
    const subject = '🔐 Suas credenciais de acesso - CíliosClick';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciais de Acesso - CíliosClick</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">CíliosClick</div>
            <h1>🔐 Suas Credenciais de Acesso</h1>
        </div>

        <p>Olá, <strong>${userName}</strong>!</p>
        
        <p>Sua compra foi processada com sucesso e seu acesso à plataforma <strong>CíliosClick</strong> já está liberado!</p>

        <div style="background-color: #f1f5f9; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
            <h3>🔑 Seus dados de acesso:</h3>
            <p><strong>URL de acesso:</strong> <a href="${loginUrl}" style="color: #7c3aed;">${loginUrl}</a></p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>Senha:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>🔒 Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro login.
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Fazer Login Agora</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
            <p><strong>Bem-vinda à CíliosClick!</strong><br>Equipe CíliosClick</p>
        </div>
    </div>
</body>
</html>`;

    const textContent = `
Olá, ${userName}!

Sua compra foi processada com sucesso e seu acesso à plataforma CíliosClick já está liberado!

🔑 SEUS DADOS DE ACESSO:
URL: ${loginUrl}
E-mail: ${email}
Senha: ${password}

🔒 IMPORTANTE: Por segurança, recomendamos que você altere sua senha após o primeiro login.

🚀 PRIMEIROS PASSOS:
1. Faça login com suas credenciais
2. Altere sua senha nas configurações
3. Explore a plataforma e comece a aplicar cílios
4. Teste com algumas fotos para se familiarizar

Se tiver dúvidas, entre em contato com nosso suporte.

Bem-vinda à CíliosClick!
Equipe CíliosClick
`;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent,
    });
  }
}

async function testarEnvioEmail() {
  console.log('🧪 Testando envio de email de credenciais...');
  console.log('');

  // Verificar configurações
  console.log('📋 Verificando configurações:');
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || 'noreply@ciliosclick.com'}`);
  console.log(`   SENDGRID_FROM_NAME: ${process.env.SENDGRID_FROM_NAME || 'CíliosClick'}`);
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ Configure SENDGRID_API_KEY no arquivo .env.local');
    console.log('');
    console.log('📝 Exemplo de configuração:');
    console.log('SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('SENDGRID_FROM_EMAIL=noreply@ciliosclick.com');
    console.log('SENDGRID_FROM_NAME=CíliosClick');
    return;
  }

  // Email de teste
  const emailTeste = 'teste@exemplo.com'; // Substitua por um email real para teste
  const nomeUsuario = 'Maria Silva';
  const senhaGerada = 'TempPass123!';
  const urlLogin = 'https://ciliosclick.com/login';

  console.log('📧 Enviando email de teste...');
  console.log(`   Para: ${emailTeste}`);
  console.log(`   Usuário: ${nomeUsuario}`);
  console.log(`   Senha: ${senhaGerada}`);
  console.log('');

  try {
    const sucesso = await EmailService.sendCredentialsEmail(
      emailTeste,
      nomeUsuario,
      senhaGerada,
      urlLogin
    );

    if (sucesso) {
      console.log('✅ Teste de envio de email concluído com sucesso!');
      console.log('');
      console.log('📋 Próximos passos:');
      console.log('1. Verifique se o email chegou na caixa de entrada');
      console.log('2. Verifique a pasta de spam se necessário');
      console.log('3. Confirme se o template está sendo exibido corretamente');
      console.log('4. Teste o link de login no email');
    } else {
      console.error('❌ Falha no teste de envio de email');
      console.log('');
      console.log('🔍 Possíveis causas:');
      console.log('1. API key do SendGrid inválida');
      console.log('2. Email remetente não verificado no SendGrid');
      console.log('3. Problemas de conectividade');
      console.log('4. Limites de envio atingidos');
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }

  console.log('');
  console.log('📚 Documentação do SendGrid: https://docs.sendgrid.com/');
}

// Executar teste
testarEnvioEmail().catch(console.error);