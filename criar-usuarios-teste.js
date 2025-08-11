// Script para criar usuários de teste usando Supabase Auth
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function criarUsuarioComAuth(email, password, nome, isAdmin = false) {
  console.log(`\n👤 Criando usuário: ${nome} (${email})...`)
  
  try {
    // 1. Criar usuário via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          is_admin: isAdmin
        }
      }
    })
    
    if (authError) {
      console.log(`❌ Erro na autenticação: ${authError.message}`)
      return null
    }
    
    if (!authData.user) {
      console.log('❌ Usuário não foi criado')
      return null
    }
    
    console.log(`✅ Usuário criado via Auth: ${authData.user.id}`)
    
    // 2. Aguardar um pouco para o trigger criar o registro na tabela users
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 3. Verificar se foi criado na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (userError) {
      console.log(`⚠️  Usuário criado no Auth mas não encontrado na tabela users: ${userError.message}`)
      
      // Tentar criar manualmente na tabela users
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          nome: nome,
          is_admin: isAdmin,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (insertError) {
        console.log(`❌ Erro ao inserir na tabela users: ${insertError.message}`)
        return authData.user
      }
      
      console.log(`✅ Usuário inserido manualmente na tabela users`)
      return insertData
    }
    
    console.log(`✅ Usuário encontrado na tabela users: ${userData.nome}`)
    return userData
    
  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`)
    return null
  }
}

async function listarUsuarios() {
  console.log('\n📊 Listando usuários cadastrados...')
  
  try {
    // Listar usuários da tabela users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log(`❌ Erro ao listar usuários: ${error.message}`)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('📭 Nenhum usuário encontrado na tabela users')
    } else {
      console.log(`\n👥 Total de usuários: ${users.length}\n`)
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Admin: ${user.is_admin ? '✅ Sim' : '❌ Não'}`)
        console.log(`   Onboarding: ${user.onboarding_completed ? '✅ Completo' : '⏳ Pendente'}`)
        console.log(`   Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`)
        console.log('')
      })
    }
    
    // Listar usuários do Auth (para comparação)
    console.log('\n🔐 Verificando usuários no Supabase Auth...')
    
    // Nota: Com chave anônima não conseguimos listar usuários do Auth
    // Isso requer service role key
    console.log('⚠️  Listagem de usuários do Auth requer service role key')
    
  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`)
  }
}

async function testarLogin(email, password) {
  console.log(`\n🔐 Testando login: ${email}...`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.log(`❌ Erro no login: ${error.message}`)
      return false
    }
    
    if (data.user) {
      console.log(`✅ Login bem-sucedido: ${data.user.email}`)
      
      // Fazer logout imediatamente
      await supabase.auth.signOut()
      console.log('🚪 Logout realizado')
      
      return true
    }
    
    console.log('❌ Login falhou - usuário não retornado')
    return false
    
  } catch (error) {
    console.log(`❌ Erro inesperado no login: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Criando usuários de teste para CíliosClick\n')
  
  // Lista usuários existentes
  await listarUsuarios()
  
  // Criar usuários de teste com emails válidos
  const usuarios = [
    {
      email: 'admin.ciliosclick@gmail.com',
      password: 'admin123456',
      nome: 'Administrador CíliosClick',
      isAdmin: true
    },
    {
      email: 'profissional.ciliosclick@gmail.com',
      password: 'prof123456',
      nome: 'Profissional Teste',
      isAdmin: false
    },
    {
      email: 'demo.ciliosclick@gmail.com',
      password: 'demo123456',
      nome: 'Usuário Demo',
      isAdmin: false
    }
  ]
  
  console.log('\n🔨 Criando usuários de teste...')
  
  for (const usuario of usuarios) {
    await criarUsuarioComAuth(
      usuario.email,
      usuario.password,
      usuario.nome,
      usuario.isAdmin
    )
  }
  
  // Aguardar um pouco
  console.log('\n⏳ Aguardando processamento...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Listar usuários novamente
  await listarUsuarios()
  
  // Testar login dos usuários criados
  console.log('\n🧪 Testando logins...')
  
  for (const usuario of usuarios) {
    await testarLogin(usuario.email, usuario.password)
  }
  
  console.log('\n✅ Processo finalizado!')
  console.log('\n📝 Credenciais criadas:')
  usuarios.forEach(u => {
    console.log(`   ${u.nome}: ${u.email} / ${u.password} ${u.isAdmin ? '(Admin)' : ''}`)
  })
}

main().catch(console.error)