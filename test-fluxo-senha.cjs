#!/usr/bin/env node

/**
 * Script de teste do novo fluxo de senha
 *
 * Uso: node test-fluxo-senha.cjs email@teste.com "Nome Teste"
 *
 * O que este script faz:
 * 1. Simula compra no Kiwify (cria usuário sem enviar email)
 * 2. Verifica que usuário foi criado
 * 3. Simula solicitação de recuperação de senha
 * 4. Mostra instruções para testar manualmente o resto do fluxo
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Credenciais do Supabase não configuradas')
  console.error('Verifique VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Gerar senha temporária (nunca enviada ao usuário)
 */
function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let senha = ''
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

/**
 * Etapa 1: Simular webhook Kiwify (criar usuário)
 */
async function criarUsuarioViaWebhook(email, nome) {
  console.log('\n' + '='.repeat(70))
  console.log('🎯 ETAPA 1: Simular Webhook Kiwify')
  console.log('='.repeat(70))
  console.log(`📧 Email: ${email}`)
  console.log(`👤 Nome: ${nome}`)

  try {
    // Verificar se usuário já existe
    console.log('\n🔍 Verificando se usuário já existe...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find(u => u.email === email)

    let userId
    let senha = gerarSenhaTemporaria()

    if (userExists) {
      console.log('⚠️  Usuário já existe, atualizando senha...')
      userId = userExists.id

      // Atualizar senha
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: senha }
      )

      if (updateError) {
        throw new Error(`Erro ao atualizar senha: ${updateError.message}`)
      }

      console.log('✅ Senha atualizada com sucesso!')
    } else {
      console.log('👤 Criando novo usuário...')

      // Criar usuário
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome: nome
        }
      })

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      userId = authUser.user.id
      console.log('✅ Usuário criado no Auth:', userId)

      // Criar perfil na tabela users
      console.log('📝 Criando perfil na tabela users...')
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          nome: nome,
          is_admin: false,
          onboarding_completed: false
        })

      if (profileError) {
        console.warn('⚠️  Erro ao criar perfil:', profileError.message)
      } else {
        console.log('✅ Perfil criado com sucesso!')
      }
    }

    console.log('\n✅ ETAPA 1 CONCLUÍDA')
    console.log('📌 User ID:', userId)
    console.log('🔒 Senha temporária gerada (NÃO enviada ao usuário):', senha)
    console.log('⚠️  IMPORTANTE: O usuário NÃO recebeu email com credenciais!')

    return { success: true, userId, senha }

  } catch (error) {
    console.error('\n❌ ERRO na Etapa 1:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Etapa 2: Verificar que usuário existe no banco
 */
async function verificarUsuarioExiste(email) {
  console.log('\n' + '='.repeat(70))
  console.log('🎯 ETAPA 2: Verificar Usuário no Banco')
  console.log('='.repeat(70))

  try {
    console.log('🔍 Buscando usuário na tabela users...')

    const { data: users, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (checkError || !users) {
      console.error('❌ Usuário NÃO encontrado na tabela users!')
      console.error('   Isso significa que a recuperação de senha NÃO funcionará.')
      return { success: false }
    }

    console.log('✅ Usuário encontrado na tabela users:')
    console.log('   ID:', users.id)
    console.log('   Email:', users.email)
    console.log('   Nome:', users.nome)
    console.log('   Admin:', users.is_admin || false)
    console.log('   Onboarding:', users.onboarding_completed || false)

    console.log('\n✅ ETAPA 2 CONCLUÍDA')
    console.log('✓ Usuário existe e pode solicitar recuperação de senha')

    return { success: true }

  } catch (error) {
    console.error('\n❌ ERRO na Etapa 2:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Etapa 3: Simular solicitação de recuperação de senha
 */
async function simularRecuperacaoSenha(email) {
  console.log('\n' + '='.repeat(70))
  console.log('🎯 ETAPA 3: Solicitar Recuperação de Senha')
  console.log('='.repeat(70))

  try {
    console.log('📧 Enviando email de recuperação via Supabase Auth...')

    // Usar cliente sem service role para simular frontend
    const clientSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    const { error: resetError } = await clientSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ciliosclick.com.br/reset-password',
    })

    if (resetError) {
      throw new Error(`Erro ao enviar email: ${resetError.message}`)
    }

    console.log('✅ Email de recuperação enviado com sucesso!')
    console.log('\n✅ ETAPA 3 CONCLUÍDA')

    return { success: true }

  } catch (error) {
    console.error('\n❌ ERRO na Etapa 3:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Mostrar instruções para teste manual
 */
function mostrarInstrucoesTesteManual(email) {
  console.log('\n' + '='.repeat(70))
  console.log('📋 INSTRUÇÕES PARA TESTE MANUAL')
  console.log('='.repeat(70))

  console.log('\n🎯 Fluxo Completo de Teste:')
  console.log('\n1️⃣  Verifique o email:', email)
  console.log('   📧 Procure por email do Supabase')
  console.log('   📂 Verifique também a pasta de SPAM')
  console.log('   📝 Assunto: "Reset Password" ou "Redefinir Senha"')

  console.log('\n2️⃣  Abra o link do email')
  console.log('   🔗 O link será algo como:')
  console.log('   https://www.ciliosclick.com.br/reset-password#access_token=xxx')

  console.log('\n3️⃣  Na página de Redefinir Senha:')
  console.log('   🔑 Digite uma nova senha (mínimo 6 caracteres)')
  console.log('   🔐 Confirme a senha')
  console.log('   ✅ Clique em "Definir Senha"')

  console.log('\n4️⃣  Faça login no sistema:')
  console.log('   🌐 Acesse: https://www.ciliosclick.com.br/login')
  console.log('   📧 Email:', email)
  console.log('   🔒 Senha: A que você acabou de definir')

  console.log('\n💡 TESTE LOCAL:')
  console.log('   Se quiser testar localmente primeiro:')
  console.log('   1. Execute: npm run dev')
  console.log('   2. Acesse: http://localhost:3000/login')
  console.log('   3. Clique em "Esqueci minha senha"')
  console.log('   4. Siga o fluxo acima')

  console.log('\n⚠️  IMPORTANTE:')
  console.log('   • O link do email expira em 1 hora')
  console.log('   • Se não receber email, verifique configuração do Supabase')
  console.log('   • Configure templates em: Supabase Dashboard → Authentication → Email Templates')

  console.log('\n🔧 TROUBLESHOOTING:')
  console.log('   Se não receber email:')
  console.log('   1. Verifique Supabase Dashboard → Authentication → Email Templates')
  console.log('   2. Confirme que SMTP está configurado no Supabase')
  console.log('   3. Teste com outro email (Gmail, Outlook, etc)')

  console.log('\n' + '='.repeat(70))
}

/**
 * Script principal
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('\n❌ Uso: node test-fluxo-senha.cjs email@teste.com "Nome Teste"')
    console.log('\nExemplo:')
    console.log('  node test-fluxo-senha.cjs eduardogelista@gmail.com "Eduardo Teste"')
    process.exit(1)
  }

  const email = args[0]
  const nome = args[1]

  console.log('\n🚀 TESTE DO FLUXO DE SENHA - CíliosClick')
  console.log('='.repeat(70))
  console.log('Este script testa o novo fluxo onde:')
  console.log('• Kiwify cria usuário (sem enviar email)')
  console.log('• Usuário usa "Esqueci minha senha"')
  console.log('• Supabase envia email de recuperação')
  console.log('• Usuário define própria senha')
  console.log('='.repeat(70))

  // Etapa 1: Criar usuário via webhook
  const result1 = await criarUsuarioViaWebhook(email, nome)
  if (!result1.success) {
    console.error('\n💥 Teste interrompido na Etapa 1')
    process.exit(1)
  }

  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Etapa 2: Verificar usuário existe
  const result2 = await verificarUsuarioExiste(email)
  if (!result2.success) {
    console.error('\n💥 Teste interrompido na Etapa 2')
    process.exit(1)
  }

  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Etapa 3: Solicitar recuperação
  const result3 = await simularRecuperacaoSenha(email)
  if (!result3.success) {
    console.error('\n💥 Teste interrompido na Etapa 3')
    console.error('\n⚠️  Possíveis causas:')
    console.error('   • SMTP não configurado no Supabase')
    console.error('   • Email templates não configurados')
    console.error('   • Rate limit atingido')
    process.exit(1)
  }

  // Mostrar instruções
  mostrarInstrucoesTesteManual(email)

  console.log('\n✅ TESTE AUTOMATIZADO CONCLUÍDO COM SUCESSO!')
  console.log('Agora siga as instruções acima para completar o teste manual.')
  console.log('\n')
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message)
  process.exit(1)
})
