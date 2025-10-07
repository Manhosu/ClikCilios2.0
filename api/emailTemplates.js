/**
 * Templates de Email para Webhooks (Node.js)
 *
 * Versão adaptada do emailTemplates.ts para uso em ambiente Node.js/Vercel
 */

/**
 * Gera template de email com credenciais
 */
function credentialsEmailTemplate(data) {
  const { userName, userEmail, password, loginUrl } = data

  const subject = '🔐 Suas credenciais de acesso - CíliosClick'

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suas Credenciais - CíliosClick</title>
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

        .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: #1f1f1f;
            margin-bottom: 20px;
            text-align: center;
        }

        .description {
            font-size: 16px;
            color: #525252;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.7;
        }

        .credentials-card {
            background: linear-gradient(135deg, #fef2f8 0%, #faf5ff 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid rgba(236, 72, 153, 0.1);
        }

        .credential-item {
            margin-bottom: 20px;
        }

        .credential-label {
            font-size: 14px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .credential-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f1f1f;
            background: white;
            padding: 12px 16px;
            border-radius: 12px;
            border: 2px solid #e9d5ff;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }

        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            display: block;
            max-width: 200px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .security-notice {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }

        .security-title {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }

        .security-text {
            font-size: 14px;
            color: #78350f;
            line-height: 1.6;
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
            margin-bottom: 15px;
        }

        .social-links {
            margin-top: 20px;
        }

        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #a855f7;
            text-decoration: none;
            font-weight: 500;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9d5ff, transparent);
            margin: 30px 0;
        }

        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 16px;
            }

            .header, .content, .footer {
                padding: 30px 20px;
            }

            .credentials-card {
                padding: 20px;
            }

            .credential-value {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CíliosClick</div>
            <div class="subtitle">Sua plataforma de beleza digital</div>
        </div>

        <div class="content">
            <h1 class="welcome-text">Bem-vinda, ${userName}! 🎉</h1>

            <p class="description">
                Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick.
                Use as credenciais abaixo para fazer seu primeiro login.
            </p>

            <div class="credentials-card">
                <div class="credential-item">
                    <div class="credential-label">Email de Acesso</div>
                    <div class="credential-value">${userEmail}</div>
                </div>

                <div class="credential-item">
                     <div class="credential-label">Senha Temporária</div>
                     <div class="credential-value">${password}</div>
                 </div>
            </div>

            <a href="${loginUrl}" class="login-button">
                Acessar Plataforma
            </a>

            <div class="divider"></div>

            <div class="security-notice">
                <div class="security-title">
                    🔒 Importante - Segurança da sua conta
                </div>
                <div class="security-text">
                    • Esta é uma senha temporária gerada automaticamente<br>
                    • Recomendamos alterar sua senha no primeiro acesso<br>
                    • Nunca compartilhe suas credenciais com terceiros<br>
                    • Em caso de dúvidas, entre em contato conosco
                </div>
            </div>

            <p class="description">
                Estamos muito felizes em tê-la conosco! Explore todas as funcionalidades da plataforma e
                transforme sua experiência com cílios digitais.
            </p>
        </div>

        <div class="footer">
            <p class="footer-text">
                Este email foi enviado automaticamente pelo sistema CíliosClick.<br>
                Se você não solicitou esta conta, pode ignorar este email.
            </p>

            <div class="social-links">
                <a href="#" class="social-link">Suporte</a>
                <a href="#" class="social-link">Política de Privacidade</a>
                <a href="#" class="social-link">Termos de Uso</a>
            </div>

            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © ${new Date().getFullYear()} CíliosClick. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
  `

  const textContent = `
Olá, ${userName}!

Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick.

🔑 SEUS DADOS DE ACESSO:
URL: ${loginUrl}
E-mail: ${userEmail}
Senha Temporária: ${password}

🔒 IMPORTANTE: Por segurança, recomendamos que você altere sua senha após o primeiro login.

🚀 PRIMEIROS PASSOS:
1. Faça login com suas credenciais
2. Altere sua senha nas configurações
3. Explore a plataforma e comece a aplicar cílios
4. Teste com algumas fotos para se familiarizar

Se tiver dúvidas, entre em contato com nosso suporte.

Bem-vinda à CíliosClick!
Equipe CíliosClick
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

module.exports = {
  credentialsEmailTemplate
}
