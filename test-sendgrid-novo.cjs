#!/usr/bin/env node

/**
 * Script de Teste - Nova API Key do SendGrid
 *
 * Este script testa se a nova API key do SendGrid está funcionando corretamente.
 *
 * Uso:
 *   node test-sendgrid-novo.cjs email@destino.com
 */

require('dotenv').config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'carinaprange86@gmail.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'CíliosClick'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'https://clik-cilios2-0.vercel.app'

// Validar configuração
if (!SENDGRID_API_KEY) {
  console.error('❌ Erro: SENDGRID_API_KEY não configurada no arquivo .env')
  process.exit(1)
}

console.log('\n🔍 Configuração Detectada:')
console.log(`   API Key: ${SENDGRID_API_KEY.substring(0, 20)}...`)
console.log(`   From Email: ${SENDGRID_FROM_EMAIL}`)
console.log(`   From Name: ${SENDGRID_FROM_NAME}`)
console.log(`   App URL: ${APP_URL}\n`)

// Template de email de teste
function gerarEmailTeste(destinatario) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste SendGrid - CíliosClick</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #fef2f8 0%, #faf5ff 100%);
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }

        .content {
            padding: 40px 30px;
        }

        .success-badge {
            background: #dcfce7;
            border: 2px solid #22c55e;
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }

        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .success-title {
            font-size: 24px;
            font-weight: 600;
            color: #166534;
            margin-bottom: 10px;
        }

        .success-text {
            font-size: 16px;
            color: #15803d;
        }

        .info-box {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }

        .info-item {
            margin-bottom: 10px;
            font-size: 14px;
            color: #525252;
        }

        .info-label {
            font-weight: 600;
            color: #7c3aed;
        }

        .footer {
            background: #fafafa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
        }

        .footer-text {
            font-size: 14px;
            color: #737373;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CíliosClick</div>
            <div class="subtitle">Teste de Configuração SendGrid</div>
        </div>

        <div class="content">
            <div class="success-badge">
                <div class="success-icon">✅</div>
                <div class="success-title">Teste Bem-Sucedido!</div>
                <div class="success-text">
                    O SendGrid está configurado corretamente e funcionando perfeitamente.
                </div>
            </div>

            <p style="margin: 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Este é um email de teste para validar a nova API key do SendGrid.
                Se você está recebendo esta mensagem, significa que:
            </p>

            <div class="info-box">
                <div class="info-item">✅ A API key está válida e ativa</div>
                <div class="info-item">✅ O email remetente está verificado</div>
                <div class="info-item">✅ O SendGrid está processando emails corretamente</div>
                <div class="info-item">✅ A configuração está pronta para produção</div>
            </div>

            <h3 style="margin: 30px 0 15px; color: #1f1f1f;">Informações da Configuração:</h3>

            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Remetente:</span> ${SENDGRID_FROM_NAME} &lt;${SENDGRID_FROM_EMAIL}&gt;
                </div>
                <div class="info-item">
                    <span class="info-label">Destinatário:</span> ${destinatario}
                </div>
                <div class="info-item">
                    <span class="info-label">Data/Hora:</span> ${new Date().toLocaleString('pt-BR')}
                </div>
                <div class="info-item">
                    <span class="info-label">API Key:</span> ${SENDGRID_API_KEY.substring(0, 25)}...
                </div>
            </div>

            <p style="margin: 30px 0 0; color: #666; font-size: 14px; font-style: italic;">
                💡 Próximo passo: Testar o envio de credenciais com o script <code>reenviar-credenciais.cjs</code>
            </p>
        </div>

        <div class="footer">
            <p class="footer-text">
                Este é um email de teste automático gerado pelo script test-sendgrid-novo.cjs
            </p>
            <p class="footer-text" style="margin-top: 10px;">
                © ${new Date().getFullYear()} CíliosClick. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
  `

  const textContent = `
Teste de Configuração SendGrid - CíliosClick

✅ Teste Bem-Sucedido!

O SendGrid está configurado corretamente e funcionando perfeitamente.

Este é um email de teste para validar a nova API key do SendGrid.
Se você está recebendo esta mensagem, significa que:

✅ A API key está válida e ativa
✅ O email remetente está verificado
✅ O SendGrid está processando emails corretamente
✅ A configuração está pronta para produção

Informações da Configuração:
- Remetente: ${SENDGRID_FROM_NAME} <${SENDGRID_FROM_EMAIL}>
- Destinatário: ${destinatario}
- Data/Hora: ${new Date().toLocaleString('pt-BR')}
- API Key: ${SENDGRID_API_KEY.substring(0, 25)}...

💡 Próximo passo: Testar o envio de credenciais com o script reenviar-credenciais.cjs

---
Este é um email de teste automático gerado pelo script test-sendgrid-novo.cjs
© ${new Date().getFullYear()} CíliosClick. Todos os direitos reservados.
  `

  return { htmlContent, textContent }
}

// Enviar email de teste
async function enviarEmailTeste(destinatario) {
  console.log(`📧 Enviando email de teste para: ${destinatario}\n`)

  const { htmlContent, textContent } = gerarEmailTeste(destinatario)

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: destinatario }],
            subject: '✅ Teste SendGrid - Configuração Bem-Sucedida!',
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        content: [
          {
            type: 'text/plain',
            value: textContent,
          },
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }),
    })

    if (response.ok) {
      console.log('✅ Email enviado com sucesso!\n')
      console.log('📋 Próximos passos:')
      console.log('   1. Verifique a caixa de entrada de:', destinatario)
      console.log('   2. Se não receber, verifique a pasta de spam')
      console.log('   3. Acesse SendGrid Dashboard → Activity → Email Activity para ver detalhes')
      console.log('   4. Teste o script de reenvio: node reenviar-credenciais.cjs email@cliente.com\n')
      return true
    } else {
      const errorData = await response.text()
      console.error('❌ Erro ao enviar email!\n')
      console.error('Status:', response.status)
      console.error('Resposta:', errorData)
      console.error('\n💡 Possíveis causas:')
      console.error('   • API key inválida ou expirada')
      console.error('   • Email remetente não verificado no SendGrid')
      console.error('   • Permissões insuficientes na API key')
      console.error('\n🔧 Solução:')
      console.error('   1. Acesse SendGrid Dashboard → Settings → API Keys')
      console.error('   2. Verifique se a key "carina" tem permissão "Mail Send - Full Access"')
      console.error('   3. Acesse Settings → Sender Authentication')
      console.error('   4. Verifique se', SENDGRID_FROM_EMAIL, 'está verificado\n')
      return false
    }
  } catch (error) {
    console.error('❌ Erro de rede ao conectar com SendGrid:\n')
    console.error(error.message)
    console.error('\n💡 Verifique sua conexão com a internet\n')
    return false
  }
}

// Execução do script
const emailDestino = process.argv[2] || SENDGRID_FROM_EMAIL

console.log('🧪 Teste de SendGrid - Nova API Key\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

enviarEmailTeste(emailDestino)
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n❌ Erro não tratado:', error)
    process.exit(1)
  })
