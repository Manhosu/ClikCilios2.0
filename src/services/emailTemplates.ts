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
    <title>Credenciais de Acesso - CíliosClick</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">CíliosClick</div>
            <h1>🔐 Suas Credenciais de Acesso</h1>
        </div>

        <p>Olá, <strong>${data.userName}</strong>!</p>
        
        <p>Sua compra foi processada com sucesso e seu acesso à plataforma <strong>CíliosClick</strong> já está liberado!</p>

        <div style="background-color: #f1f5f9; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
            <h3>🔑 Seus dados de acesso:</h3>
            <p><strong>URL de acesso:</strong> <a href="${data.loginUrl}" style="color: #7c3aed;">${data.loginUrl}</a></p>
            <p><strong>E-mail:</strong> ${data.userEmail}</p>
            <p><strong>Senha:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>🔒 Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro login.
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3>🚀 Primeiros passos:</h3>
            <div style="margin-bottom: 15px; padding-left: 10px;">1. <strong>Faça login</strong> com suas credenciais</div>
            <div style="margin-bottom: 15px; padding-left: 10px;">2. <strong>Altere sua senha</strong> nas configurações</div>
            <div style="margin-bottom: 15px; padding-left: 10px;">3. <strong>Explore a plataforma</strong> e comece a aplicar cílios</div>
            <div style="margin-bottom: 15px; padding-left: 10px;">4. <strong>Teste com algumas fotos</strong> para se familiarizar</div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Fazer Login Agora</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
            <p><strong>Bem-vinda à CíliosClick!</strong><br>Equipe CíliosClick</p>
        </div>
    </div>
</body>
</html>`

    const textContent = `
Olá, ${data.userName}!

Sua compra foi processada com sucesso e seu acesso à plataforma CíliosClick já está liberado!

🔑 SEUS DADOS DE ACESSO:
URL: ${data.loginUrl}
E-mail: ${data.userEmail}
Senha: ${data.password}

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