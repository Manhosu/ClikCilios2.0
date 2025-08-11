// Script para consultar usuários cadastrados no banco de dados
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

// Cliente com chave anônima (limitado por RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('⚠️  Usando chave anônima - dados limitados por Row Level Security (RLS)')

async function consultarUsuarios() {
  try {
    console.log('🔍 Consultando usuários cadastrados...')
    
    // Busca todos os usuários
    const { data: usuarios, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao consultar usuários:', error)
      return
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('📭 Nenhum usuário encontrado no banco de dados')
      return
    }
    
    console.log(`\n📊 Total de usuários cadastrados: ${usuarios.length}\n`)
    
    usuarios.forEach((usuario, index) => {
      console.log(`👤 Usuário ${index + 1}:`)
      console.log(`   ID: ${usuario.id}`)
      console.log(`   Email: ${usuario.email}`)
      console.log(`   Nome: ${usuario.nome}`)
      console.log(`   Admin: ${usuario.is_admin ? '✅ Sim' : '❌ Não'}`)
      console.log(`   Onboarding: ${usuario.onboarding_completed ? '✅ Completo' : '⏳ Pendente'}`)
      console.log(`   Criado em: ${new Date(usuario.created_at).toLocaleString('pt-BR')}`)
      console.log(`   Atualizado em: ${new Date(usuario.updated_at).toLocaleString('pt-BR')}`)
      console.log('   ' + '-'.repeat(50))
    })
    
    // Estatísticas
    const admins = usuarios.filter(u => u.is_admin).length
    const onboardingCompleto = usuarios.filter(u => u.onboarding_completed).length
    
    console.log('\n📈 Estatísticas:')
    console.log(`   Administradores: ${admins}`)
    console.log(`   Usuários comuns: ${usuarios.length - admins}`)
    console.log(`   Onboarding completo: ${onboardingCompleto}`)
    console.log(`   Onboarding pendente: ${usuarios.length - onboardingCompleto}`)
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

async function consultarClientes() {
  try {
    console.log('\n🔍 Consultando clientes cadastrados...')
    
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select(`
        *,
        users!clientes_user_id_fkey(email, nome)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao consultar clientes:', error)
      return
    }
    
    if (!clientes || clientes.length === 0) {
      console.log('📭 Nenhum cliente encontrado no banco de dados')
      return
    }
    
    console.log(`\n👥 Total de clientes cadastrados: ${clientes.length}\n`)
    
    clientes.forEach((cliente, index) => {
      console.log(`👤 Cliente ${index + 1}:`)
      console.log(`   ID: ${cliente.id}`)
      console.log(`   Nome: ${cliente.nome}`)
      console.log(`   Email: ${cliente.email || 'Não informado'}`)
      console.log(`   Telefone: ${cliente.telefone || 'Não informado'}`)
      console.log(`   Data Nascimento: ${cliente.data_nascimento || 'Não informado'}`)
      console.log(`   Proprietário: ${cliente.users?.nome} (${cliente.users?.email})`)
      console.log(`   Criado em: ${new Date(cliente.created_at).toLocaleString('pt-BR')}`)
      console.log('   ' + '-'.repeat(50))
    })
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

async function consultarCupons() {
  try {
    console.log('\n🔍 Consultando cupons cadastrados...')
    
    const { data: cupons, error } = await supabase
      .from('cupons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao consultar cupons:', error)
      return
    }
    
    if (!cupons || cupons.length === 0) {
      console.log('📭 Nenhum cupom encontrado no banco de dados')
      return
    }
    
    console.log(`\n🎫 Total de cupons cadastrados: ${cupons.length}\n`)
    
    cupons.forEach((cupom, index) => {
      console.log(`🎫 Cupom ${index + 1}:`)
      console.log(`   ID: ${cupom.id}`)
      console.log(`   Código: ${cupom.codigo}`)
      console.log(`   Parceira: ${cupom.parceira_nome}`)
      console.log(`   Email: ${cupom.parceira_email}`)
      console.log(`   Comissão: ${cupom.percentual_comissao}%`)
      console.log(`   Status: ${cupom.ativo ? '✅ Ativo' : '❌ Inativo'}`)
      console.log(`   Criado em: ${new Date(cupom.created_at).toLocaleString('pt-BR')}`)
      console.log('   ' + '-'.repeat(50))
    })
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executa as consultas
async function main() {
  console.log('🚀 Iniciando consulta ao banco de dados CíliosClick\n')
  
  await consultarUsuarios()
  await consultarClientes()
  await consultarCupons()
  
  console.log('\n✅ Consulta finalizada!')
}

main().catch(console.error)