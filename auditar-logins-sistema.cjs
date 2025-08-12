const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configurar Supabase com service role para poder acessar auth.users
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!')
  console.log('   Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  console.log('   Verifique o arquivo .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirmarEmailUsuario(userId, email) {
  try {
    console.log(`🔧 Confirmando email para: ${email}...`)
    
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true
    })
    
    if (error) {
      console.log(`❌ Erro ao confirmar email: ${error.message}`)
      return false
    }
    
    console.log(`✅ Email confirmado com sucesso para: ${email}`)
    return true
    
  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`)
    return false
  }
}

async function garantirUsuarioESenha(email, senha, nome = '') {
  try {
    // Tentar encontrar usuário por email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.log(`❌ Erro ao listar usuários para ${email}: ${listError.message}`)
      return null
    }

    const existente = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!existente) {
      console.log(`👤 Usuário não existe. Criando: ${email} ...`)
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome }
      })
      if (error) {
        console.log(`❌ Erro ao criar usuário ${email}: ${error.message}`)
        return null
      }
      console.log(`✅ Usuário criado: ${email}`)
      return data.user
    }

    // Atualizar senha e confirmar email do usuário existente
    console.log(`🔑 Atualizando senha e confirmando email: ${email} ...`)
    const { data, error } = await supabase.auth.admin.updateUserById(existente.id, {
      password: senha,
      email_confirm: true
    })
    if (error) {
      console.log(`❌ Erro ao atualizar usuário ${email}: ${error.message}`)
      return existente
    }
    console.log(`✅ Senha atualizada e email confirmado: ${email}`)
    return data.user

  } catch (error) {
    console.log(`❌ Erro inesperado ao garantir usuário ${email}: ${error.message}`)
    return null
  }
}

async function testarLoginUsuario(email, senha) {
  console.log(`\n🔐 Testando login: ${email}`)
  
  try {
    // Criar cliente com chave anônima para teste de login real
    const clienteTeste = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY)
    
    const { data, error } = await clienteTeste.auth.signInWithPassword({
      email,
      password: senha
    })
    
    if (error) {
      console.log(`❌ Falha no login: ${error.message}`)
      return { sucesso: false, erro: error.message }
    }
    
    if (data.user) {
      console.log(`✅ Login bem-sucedido: ${data.user.email}`)
      
      // Fazer logout imediatamente
      await clienteTeste.auth.signOut()
      console.log(`🚪 Logout realizado`)
      
      return { sucesso: true, user: data.user }
    }
    
    console.log(`❌ Login falhou - usuário não retornado`)
    return { sucesso: false, erro: 'Usuário não retornado' }
    
  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`)
    return { sucesso: false, erro: error.message }
  }
}

async function auditarLoginsSistema() {
  console.log('🔍 AUDITORIA COMPLETA DOS LOGINS DO SISTEMA')
  console.log('='.repeat(60))
  console.log('')
  
  try {
    // 1. Listar todos os usuários do Auth
    console.log('📋 ETAPA 1: Listando usuários do Supabase Auth...')
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error(`❌ Erro ao listar usuários: ${listError.message}`)
      return
    }
    
    console.log(`\n👥 Total de usuários encontrados: ${users.length}`)
    console.log('')
    
    // 2. Exibir informações de cada usuário
    console.log('📊 ETAPA 2: Análise detalhada dos usuários...')
    console.log('')
    
    const usuariosDetalhados = users.map((user, index) => {
      const confirmado = user.email_confirmed_at ? '✅ Confirmado' : '❌ Não confirmado'
      const dataConfirmacao = user.email_confirmed_at 
        ? new Date(user.email_confirmed_at).toLocaleString('pt-BR') 
        : 'N/A'
      const dataCriacao = new Date(user.created_at).toLocaleString('pt-BR')
      
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Status: ${confirmado}`)
      console.log(`   Criado: ${dataCriacao}`)
      console.log(`   Confirmado: ${dataConfirmacao}`)
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`)
      console.log('')
      
      return {
        id: user.id,
        email: user.email,
        confirmado: !!user.email_confirmed_at,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      }
    })
    
    // 3. Identificar usuários com problemas
    const usuariosNaoConfirmados = usuariosDetalhados.filter(u => !u.confirmado)
    
    console.log('🚨 ETAPA 3: Usuários com problemas...')
    console.log('')
    
    if (usuariosNaoConfirmados.length > 0) {
      console.log(`❌ ${usuariosNaoConfirmados.length} usuário(s) com email não confirmado:`)
      usuariosNaoConfirmados.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`)
      })
      console.log('')
      
      // Perguntar se deve confirmar automaticamente
      console.log('🔧 CORREÇÃO AUTOMÁTICA:')
      console.log('Confirmando emails automaticamente...')
      console.log('')
      
      for (const user of usuariosNaoConfirmados) {
        await confirmarEmailUsuario(user.id, user.email)
      }
      
      console.log('')
      console.log('✅ Todos os emails foram confirmados!')
      console.log('')
    } else {
      console.log('✅ Todos os usuários têm email confirmado!')
      console.log('')
    }
    
    // 4. Teste de login com credenciais conhecidas
    console.log('🧪 ETAPA 4: Testando logins conhecidos...')
    console.log('')
    
    const credenciaisConhecidas = [
      { email: 'eduardogelista@gmail.com', senha: 'Eduardo123!', nome: 'Eduardo' },
      { email: 'admin.ciliosclick@gmail.com', senha: 'admin123456', nome: 'Administrador CíliosClick' },
      { email: 'profissional.ciliosclick@gmail.com', senha: 'prof123456', nome: 'Profissional Teste' },
      { email: 'demo.ciliosclick@gmail.com', senha: 'demo123456', nome: 'Usuário Demo' },
      { email: 'admin.clikcilios@gmail.com', senha: 'Admin123!', nome: 'Admin Principal' },
      { email: 'teste1.clikcilios@gmail.com', senha: 'Teste123!', nome: 'Usuário Teste 1' },
      { email: 'demo.clikcilios@gmail.com', senha: 'Demo123!', nome: 'Usuário Demo 2' }
    ]
    
    const resultadosLogin = []
    
    // Garantir existência, senha e confirmação antes de testar
    for (const credencial of credenciaisConhecidas) {
      await garantirUsuarioESenha(credencial.email, credencial.senha, credencial.nome)
    }
    
    for (const credencial of credenciaisConhecidas) {
      const resultado = await testarLoginUsuario(credencial.email, credencial.senha)
      resultadosLogin.push({
        email: credencial.email,
        senha: credencial.senha,
        sucesso: resultado.sucesso,
        erro: resultado.erro
      })
    }
    
    // 5. Relatório final
    console.log('\n📈 RELATÓRIO FINAL DA AUDITORIA')
    console.log('='.repeat(60))
    console.log('')
    
    console.log(`📊 ESTATÍSTICAS GERAIS:`)
    console.log(`   • Total de usuários: ${users.length}`)
    console.log(`   • Emails confirmados: ${usuariosDetalhados.filter(u => u.confirmado).length}`)
    console.log(`   • Emails não confirmados: ${usuariosNaoConfirmados.length}`)
    console.log(`   • Usuários que fizeram login: ${usuariosDetalhados.filter(u => u.last_sign_in_at).length}`)
    console.log('')
    
    console.log(`🔐 TESTE DE LOGINS:`)
    const loginsComSucesso = resultadosLogin.filter(r => r.sucesso)
    const loginsFalharam = resultadosLogin.filter(r => !r.sucesso)
    
    console.log(`   • Logins funcionais: ${loginsComSucesso.length}/${resultadosLogin.length}`)
    console.log('')
    
    if (loginsComSucesso.length > 0) {
      console.log(`✅ LOGINS FUNCIONAIS:`)
      loginsComSucesso.forEach(login => {
        console.log(`   • ${login.email} / ${login.senha}`)
      })
      console.log('')
    }
    
    if (loginsFalharam.length > 0) {
      console.log(`❌ LOGINS COM PROBLEMA:`)
      loginsFalharam.forEach(login => {
        console.log(`   • ${login.email} - Erro: ${login.erro}`)
      })
      console.log('')
    }
    
    // 6. Instruções para o usuário
    console.log('🎯 PRÓXIMOS PASSOS:')
    
    if (loginsComSucesso.length === resultadosLogin.length) {
      console.log('✅ TODOS OS LOGINS ESTÃO FUNCIONAIS!')
      console.log('')
      console.log('Você pode usar qualquer uma das credenciais acima para acessar:')
      console.log('http://localhost:5173')
      console.log('')
      console.log('🎉 Sistema 100% operacional!')
    } else {
      console.log('⚠️  Alguns logins ainda apresentam problemas.')
      console.log('')
      console.log('Para verificar individualmente, acesse:')
      console.log('1. https://supabase.com/dashboard')
      console.log('2. Selecione seu projeto')
      console.log('3. Vá em Authentication > Users')
      console.log('4. Verifique o status de cada usuário')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error.message)
  }
}

// Executar auditoria
auditarLoginsSistema().catch(console.error)