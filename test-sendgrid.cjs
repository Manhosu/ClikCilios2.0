require('dotenv').config();

async function testSendGrid() {
  console.log('🔍 Verificando configuração do SendGrid...');
  
  // Verificar variáveis de ambiente
  console.log('\n📋 Variáveis de ambiente:');
  const apiKey = process.env.SENDGRID_API_KEY || process.env.VITE_SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@ciliosclick.com';
  const fromName = process.env.SENDGRID_FROM_NAME || process.env.VITE_SENDGRID_FROM_NAME || 'CíliosClick';
  
  console.log('SENDGRID_API_KEY:', apiKey ? (apiKey === 'your_sendgrid_api_key' ? '❌ Placeholder' : '✅ Configurada') : '❌ Não configurada');
  console.log('SENDGRID_FROM_EMAIL:', fromEmail);
  console.log('SENDGRID_FROM_NAME:', fromName);
  
  if (!apiKey || apiKey === 'your_sendgrid_api_key') {
    console.log('\n❌ SENDGRID_API_KEY não está configurada corretamente!');
    console.log('\n📝 Para configurar o SendGrid:');
    console.log('1. Acesse https://app.sendgrid.com/');
    console.log('2. Vá em Settings > API Keys');
    console.log('3. Crie uma nova API Key com permissões de envio');
    console.log('4. Adicione no arquivo .env:');
    console.log('   SENDGRID_API_KEY="sua_api_key_aqui"');
    console.log('   SENDGRID_FROM_EMAIL="seu_email_verificado@dominio.com"');
    console.log('\n⚠️  IMPORTANTE: O email remetente deve ser verificado no SendGrid!');
    return;
  }
  
  console.log('\n📧 Testando conexão com a API do SendGrid...');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: 'teste@exemplo.com' }],
            subject: 'Teste de Configuração SendGrid - CíliosClick',
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: 'Este é um teste de configuração do SendGrid para o sistema CíliosClick.',
          },
          {
            type: 'text/html',
            value: '<h1>Teste de Configuração</h1><p>Este é um teste de configuração do SendGrid para o sistema CíliosClick.</p>',
          },
        ],
      }),
    });
    
    if (response.ok) {
      console.log('✅ Configuração do SendGrid está funcionando!');
      console.log('📤 Email de teste enviado com sucesso');
    } else {
      const errorData = await response.text();
      console.log('❌ Falha no envio do email');
      console.log('Status:', response.status);
      console.log('Erro:', errorData);
      
      if (response.status === 401) {
        console.log('\n🔑 Erro de autenticação - verifique se a API Key está correta');
      } else if (response.status === 403) {
        console.log('\n🚫 Erro de permissão - verifique se o email remetente está verificado no SendGrid');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar SendGrid:', error.message);
  }
}

testSendGrid().catch(console.error);