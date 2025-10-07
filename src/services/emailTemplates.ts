/**
 * Templates de email para comunicação com usuárias e parceiras
 */

interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

interface WelcomeEmailData {
  userName: string
  userEmail: string
  loginUrl: string
  cupomCode?: string
  parceiraName?: string
}

interface ParceiraNotificationData {
  parceiraName: string
  parceiraEmail: string
  clientName: string
  clientEmail: string
  cupomCode: string
  commissionAmount: number
  purchaseValue: number
}

interface CredentialsEmailData {
  userName: string
  userEmail: string
  password: string
  loginUrl: string
}

/**
 * Serviço para gerar templates de email
 */
export class EmailTemplatesService {
  
  /**
   * Template de email de boas-vindas para nova usuária
   */
  static welcomeEmail(data: WelcomeEmailData): EmailTemplate {
    const subject = '🎉 Acesso liberado – Bem-vinda à CíliosClick!'
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vinda à CíliosClick</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">CíliosClick</div>
            <h1>🎉 Bem-vinda, ${data.userName}!</h1>
        </div>

        <p>Seja bem-vinda à plataforma <strong>CíliosClick</strong> – a ferramenta ideal para mostrar às suas clientes como os cílios ficarão, com realismo e profissionalismo.</p>

        ${data.cupomCode ? `
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <h3>✨ Acesso via cupom ${data.cupomCode}</h3>
            <p>Você foi indicada por <strong>${data.parceiraName}</strong> e seu acesso já está liberado!</p>
        </div>
        ` : ''}

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <h3>🔐 Seu acesso já está liberado</h3>
            <p><strong>Acesse:</strong> <a href="${data.loginUrl}" style="color: #7c3aed;">${data.loginUrl}</a></p>
            <p><strong>E-mail:</strong> ${data.userEmail}</p>
            <p>Para criar sua senha, clique em <strong>"Esqueci minha senha"</strong> na tela de login.</p>
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
            <strong>💡 Dica Profissional:</strong> Use fotos com boa iluminação, olhos bem abertos e sem maquiagem pesada nos cílios para obter os melhores resultados.
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Começar Agora</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
            <p><strong>Bons atendimentos!</strong><br>Equipe CíliosClick</p>
        </div>
    </div>
</body>
</html>`

    const textContent = `
Olá, ${data.userName}!

Seja bem-vinda à plataforma CíliosClick – a ferramenta ideal para mostrar às suas clientes como os cílios ficarão, com realismo e profissionalismo.

${data.cupomCode ? `✨ Acesso via cupom ${data.cupomCode}
Você foi indicada por ${data.parceiraName} e seu acesso já está liberado!

` : ''}🔐 SEU ACESSO JÁ ESTÁ LIBERADO:
Acesse: ${data.loginUrl}
E-mail: ${data.userEmail}
Para criar sua senha, clique em "Esqueci minha senha" na tela de login.

🚀 COMO COMEÇAR:
1. Faça login na plataforma
2. Acesse o menu "Aplicar Cílios"
3. Envie a foto da cliente
4. Escolha o estilo e visualize o resultado
5. Baixe a imagem final para enviar à sua cliente

💡 DICA PROFISSIONAL:
Use fotos com boa iluminação, olhos bem abertos e sem maquiagem pesada nos cílios para obter os melhores resultados.

Se tiver dúvidas, entre em contato com nosso suporte.

Bons atendimentos!
Equipe CíliosClick
    `.trim()

    return { subject, htmlContent, textContent }
  }

  /**
   * Template de notificação para parceira sobre nova venda
   */
  static parceiraNotification(data: ParceiraNotificationData): EmailTemplate {
    const subject = `🎉 Nova venda com seu cupom! Comissão de R$ ${data.commissionAmount.toFixed(2)}`
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Venda - CíliosClick</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <h1>🎉 Parabéns, ${data.parceiraName}!</h1>
            <p>Você tem uma nova venda na CíliosClick</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2>Nova comissão disponível!</h2>
            <div style="font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0;">R$ ${data.commissionAmount.toFixed(2)}</div>
            <p>Sua indicação resultou em uma nova assinatura</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Detalhes da Venda:</h3>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>E-mail:</strong> ${data.clientEmail}</p>
            <p><strong>Cupom utilizado:</strong> ${data.cupomCode}</p>
            <p><strong>Valor da compra:</strong> R$ ${data.purchaseValue.toFixed(2)}</p>
            <p><strong>Sua comissão:</strong> R$ ${data.commissionAmount.toFixed(2)}</p>
        </div>

        <p>A cliente já teve o acesso liberado automaticamente e recebeu as instruções por email. Ela pode começar a usar a plataforma imediatamente!</p>

        <p>Continue compartilhando seu cupom para gerar mais comissões. Obrigada por ser nossa parceira!</p>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p><strong>Equipe CíliosClick</strong></p>
            <p>Trabalhando juntas pelo sucesso do seu negócio</p>
        </div>
    </div>
</body>
</html>`

    const textContent = `
🎉 Parabéns, ${data.parceiraName}!

Você tem uma nova venda na CíliosClick

NOVA COMISSÃO DISPONÍVEL: R$ ${data.commissionAmount.toFixed(2)}
Sua indicação resultou em uma nova assinatura

📋 DETALHES DA VENDA:
Cliente: ${data.clientName}
E-mail: ${data.clientEmail}
Cupom utilizado: ${data.cupomCode}
Valor da compra: R$ ${data.purchaseValue.toFixed(2)}
Sua comissão: R$ ${data.commissionAmount.toFixed(2)}

A cliente já teve o acesso liberado automaticamente e recebeu as instruções por email. Ela pode começar a usar a plataforma imediatamente!

Continue compartilhando seu cupom para gerar mais comissões. Obrigada por ser nossa parceira!

Equipe CíliosClick
Trabalhando juntas pelo sucesso do seu negócio
    `.trim()

    return { subject, htmlContent, textContent }
  }

  /**
   * Gerar conteúdo do guia rápido em formato de texto
   */
  static quickGuideText(): string {
    return `
📖 GUIA RÁPIDO - CILIOSCLICK

🔐 1. ACESSO À PLATAFORMA
• Acesse o link enviado por email
• Use seu email de cadastro
• Clique em "Esqueci minha senha" para criar uma nova senha
• Faça login e seja bem-vinda!

📷 2. UPLOAD DA FOTO
• Clique em "Aplicar Cílios" no menu
• Selecione uma foto da sua cliente
• Formatos aceitos: JPEG, PNG (até 10MB)
💡 Dica: Use fotos com boa iluminação, olhos bem abertos e sem maquiagem pesada nos cílios.

✨ 3. ESTILOS DISPONÍVEIS
• Volume Fio a Fio D - Efeito natural e delicado
• Volume Brasileiro D - Curvatura brasileira marcante
• Volume Egípcio 3D D - Volume dramático egípcio
• Volume Russo D - Técnica russa clássica
• Boneca - Efeito boneca encantador
• Fox Eyes - Olhar felino moderno

🎯 4. RESULTADO E DOWNLOAD
• Aguarde o processamento (alguns segundos)
• Visualize o resultado na tela
• Clique em "Baixar Resultado" para salvar
• Compartilhe com sua cliente!

💼 5. DICAS PROFISSIONAIS
• Mostre diferentes estilos para a cliente escolher
• Use as imagens durante a consulta
• Salve os resultados para referência futura
• Compartilhe nas redes sociais (com permissão)

📞 6. SUPORTE
• Dúvidas técnicas: Entre em contato pelo email de suporte
• Sugestões: Adoramos feedback para melhorar
• Atualizações: Fique atenta aos emails informativos

Equipe CíliosClick
Juntas, transformando atendimentos em experiências inesquecíveis! ✨
    `.trim()
  }

  /**
   * Template de email com credenciais de acesso
   */
  static credentialsEmail(data: CredentialsEmailData): EmailTemplate {
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
                  <h1 class="welcome-text">Bem-vinda, ${data.userName}! 🎉</h1>
                  
                  <p class="description">
                      Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick. 
                      Use as credenciais abaixo para fazer seu primeiro login.
                  </p>
                  
                  <div class="credentials-card">
                      <div class="credential-item">
                          <div class="credential-label">Email de Acesso</div>
                          <div class="credential-value">${data.userEmail}</div>
                      </div>
                      
                      <div class="credential-item">
                           <div class="credential-label">Senha Temporária</div>
                           <div class="credential-value">${data.password}</div>
                       </div>
                  </div>
                  
                  <a href="${data.loginUrl}" class="login-button">
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
                      © 2024 CíliosClick. Todos os direitos reservados.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `

    const textContent = `
Olá, ${data.userName}!

Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick.

🔑 SEUS DADOS DE ACESSO:
URL: ${data.loginUrl}
E-mail: ${data.userEmail}
Senha Temporária: ${data.password}

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
}