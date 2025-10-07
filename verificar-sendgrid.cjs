#!/usr/bin/env node

/**
 * Script de Verificação - Configuração SendGrid
 *
 * Este script verifica se toda a configuração do SendGrid está correta:
 * - API Key válida
 * - Email remetente verificado
 * - Permissões adequadas
 *
 * Uso:
 *   node verificar-sendgrid.cjs
 */

require('dotenv').config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'carinaprange86@gmail.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'CíliosClick'

console.log('\n🔍 Verificação de Configuração SendGrid\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// 1. Verificar variáveis de ambiente
console.log('📋 1. Verificando Variáveis de Ambiente...\n')

const checks = {
  apiKey: {
    name: 'SENDGRID_API_KEY',
    value: SENDGRID_API_KEY,
    required: true,
    status: null,
    message: ''
  },
  fromEmail: {
    name: 'SENDGRID_FROM_EMAIL',
    value: SENDGRID_FROM_EMAIL,
    required: true,
    status: null,
    message: ''
  },
  fromName: {
    name: 'SENDGRID_FROM_NAME',
    value: SENDGRID_FROM_NAME,
    required: false,
    status: null,
    message: ''
  }
}

// Verificar API Key
if (!checks.apiKey.value) {
  checks.apiKey.status = 'error'
  checks.apiKey.message = 'Não configurada no .env'
} else if (!checks.apiKey.value.startsWith('SG.')) {
  checks.apiKey.status = 'error'
  checks.apiKey.message = 'Formato inválido (deve começar com SG.)'
} else {
  checks.apiKey.status = 'success'
  checks.apiKey.message = `Configurada (${checks.apiKey.value.substring(0, 20)}...)`
}

// Verificar From Email
if (!checks.fromEmail.value) {
  checks.fromEmail.status = 'error'
  checks.fromEmail.message = 'Não configurada'
} else if (!checks.fromEmail.value.includes('@')) {
  checks.fromEmail.status = 'error'
  checks.fromEmail.message = 'Formato de email inválido'
} else if (checks.fromEmail.value.endsWith('@gmail.com')) {
  checks.fromEmail.status = 'warning'
  checks.fromEmail.message = `${checks.fromEmail.value} (Gmail pode ter limitações)`
} else {
  checks.fromEmail.status = 'success'
  checks.fromEmail.message = checks.fromEmail.value
}

// Verificar From Name
if (!checks.fromName.value) {
  checks.fromName.status = 'warning'
  checks.fromName.message = 'Não configurada (usará email como nome)'
} else {
  checks.fromName.status = 'success'
  checks.fromName.message = checks.fromName.value
}

// Exibir resultados
for (const check of Object.values(checks)) {
  const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️ ' : '❌'
  const required = check.required ? '(obrigatória)' : '(opcional)'
  console.log(`${icon} ${check.name} ${required}`)
  console.log(`   ${check.message}\n`)
}

// 2. Testar conexão com SendGrid
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('🔌 2. Testando Conexão com SendGrid API...\n')

async function testarConexao() {
  if (!SENDGRID_API_KEY) {
    console.log('❌ Não é possível testar sem API key configurada\n')
    return false
  }

  try {
    // Testar endpoint de API Stats (não envia email)
    const response = await fetch('https://api.sendgrid.com/v3/user/username', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Conexão bem-sucedida!')
      console.log(`   Username: ${data.username}`)
      console.log(`   User ID: ${data.user_id}\n`)
      return true
    } else if (response.status === 401) {
      console.log('❌ API key inválida ou expirada!')
      console.log('   Status: 401 Unauthorized\n')
      console.log('💡 Solução:')
      console.log('   1. Acesse: https://app.sendgrid.com/settings/api_keys')
      console.log('   2. Verifique se a key "carina" está ativa')
      console.log('   3. Se necessário, crie uma nova key com permissão "Mail Send - Full Access"\n')
      return false
    } else {
      const errorData = await response.text()
      console.log(`❌ Erro na conexão (Status ${response.status})`)
      console.log(`   Resposta: ${errorData}\n`)
      return false
    }
  } catch (error) {
    console.log('❌ Erro de rede ao conectar com SendGrid')
    console.log(`   ${error.message}\n`)
    return false
  }
}

// 3. Verificar sender authentication
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('🔐 3. Verificando Autenticação do Remetente...\n')

async function verificarSender() {
  if (!SENDGRID_API_KEY) {
    console.log('❌ Não é possível verificar sem API key configurada\n')
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        console.log('⚠️  Nenhum sender verificado encontrado!')
        console.log('\n💡 Ação necessária:')
        console.log('   1. Acesse: https://app.sendgrid.com/settings/sender_auth/senders')
        console.log('   2. Clique em "Create New Sender"')
        console.log('   3. Preencha os dados do remetente:')
        console.log(`      - From Email: ${SENDGRID_FROM_EMAIL}`)
        console.log(`      - From Name: ${SENDGRID_FROM_NAME}`)
        console.log('   4. Verifique o email recebido na caixa de entrada\n')
        return false
      }

      const sender = data.results.find(s => s.from_email === SENDGRID_FROM_EMAIL)

      if (sender) {
        if (sender.verified) {
          console.log('✅ Email remetente verificado!')
          console.log(`   Email: ${sender.from_email}`)
          console.log(`   Nome: ${sender.from_name}`)
          console.log(`   Verificado: Sim\n`)
          return true
        } else {
          console.log('⚠️  Email remetente configurado mas NÃO verificado!')
          console.log(`   Email: ${sender.from_email}`)
          console.log(`   Status: Aguardando verificação\n`)
          console.log('💡 Ação necessária:')
          console.log('   1. Verifique a caixa de entrada de:', SENDGRID_FROM_EMAIL)
          console.log('   2. Procure por email de verificação do SendGrid')
          console.log('   3. Clique no link de verificação no email\n')
          return false
        }
      } else {
        console.log('⚠️  Email remetente não encontrado nos senders verificados!')
        console.log(`   Email procurado: ${SENDGRID_FROM_EMAIL}`)
        console.log('\n   Senders verificados:')
        data.results.forEach(s => {
          console.log(`   • ${s.from_email} (${s.verified ? 'Verificado' : 'Pendente'})`)
        })
        console.log('\n💡 Solução: Adicione o email', SENDGRID_FROM_EMAIL, 'como sender verificado\n')
        return false
      }
    } else if (response.status === 403) {
      console.log('⚠️  Permissões insuficientes para verificar senders')
      console.log('   A API key não tem permissão para acessar esta informação')
      console.log('\n💡 Verifique manualmente:')
      console.log('   1. Acesse: https://app.sendgrid.com/settings/sender_auth/senders')
      console.log('   2. Procure por:', SENDGRID_FROM_EMAIL)
      console.log('   3. Verifique se o status é "Verified"\n')
      return null
    } else {
      console.log(`⚠️  Não foi possível verificar senders (Status ${response.status})`)
      console.log('   Verifique manualmente no SendGrid Dashboard\n')
      return null
    }
  } catch (error) {
    console.log('❌ Erro ao verificar senders:', error.message, '\n')
    return null
  }
}

// Executar verificações
async function verificarTudo() {
  const conexaoOk = await testarConexao()
  const senderOk = await verificarSender()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 Resumo da Verificação\n')

  const problemasCriticos = []
  const avisos = []

  // Verificar problemas
  if (checks.apiKey.status === 'error') problemasCriticos.push('API Key não configurada ou inválida')
  if (checks.apiKey.status === 'warning') avisos.push('API Key antiga - recomenda-se atualizar')
  if (checks.fromEmail.status === 'error') problemasCriticos.push('Email remetente não configurado')
  if (checks.fromEmail.status === 'warning') avisos.push('Email Gmail pode ter limitações de envio')
  if (!conexaoOk) problemasCriticos.push('Conexão com SendGrid falhou')
  if (senderOk === false) problemasCriticos.push('Email remetente não verificado')

  if (problemasCriticos.length > 0) {
    console.log('❌ Problemas Críticos Encontrados:\n')
    problemasCriticos.forEach(p => console.log(`   • ${p}`))
    console.log()
  }

  if (avisos.length > 0) {
    console.log('⚠️  Avisos:\n')
    avisos.forEach(a => console.log(`   • ${a}`))
    console.log()
  }

  if (problemasCriticos.length === 0 && senderOk === true) {
    console.log('✅ Tudo certo! SendGrid está configurado corretamente.\n')
    console.log('📧 Próximos passos:')
    console.log('   1. Execute: node test-sendgrid-novo.cjs email@teste.com')
    console.log('   2. Verifique se o email foi recebido')
    console.log('   3. Configure as mesmas variáveis no Vercel')
    console.log('   4. Faça deploy e teste em produção\n')
  } else {
    console.log('🔧 Ações necessárias:')
    console.log('   1. Corrija os problemas críticos listados acima')
    console.log('   2. Execute este script novamente para verificar')
    console.log('   3. Consulte: SOLUCAO_EMAIL_CREDENCIAIS.md\n')
  }
}

verificarTudo()
  .catch(error => {
    console.error('\n❌ Erro não tratado:', error)
    process.exit(1)
  })
