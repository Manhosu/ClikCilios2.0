// Script para verificar estrutura do banco e criar dados de teste
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verificarTabelas() {
  console.log('🔍 Verificando estrutura do banco de dados...\n')
  
  // Tenta consultar cada tabela
  const tabelas = ['users', 'clientes', 'cupons', 'usos_cupons']
  
  for (const tabela of tabelas) {
    try {
      const { data, error, count } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Tabela '${tabela}': ${error.message}`)
      } else {
        console.log(`✅ Tabela '${tabela}': ${count || 0} registros`)
      }
    } catch (err) {
      console.log(`❌ Tabela '${tabela}': Erro inesperado - ${err.message}`)
    }
  }
}

async function criarUsuarioTeste() {
  console.log('\n👤 Criando usuário de teste...')
  
  const usuarioTeste = {
    id: crypto.randomUUID(),
    email: 'admin@ciliosclick.com',
    nome: 'Administrador CíliosClick',
    is_admin: true,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([usuarioTeste])
      .select()
    
    if (error) {
      console.log(`❌ Erro ao criar usuário: ${error.message}`)
      
      // Tenta verificar se já existe
      const { data: existente } = await supabase
        .from('users')
        .select('*')
        .eq('email', usuarioTeste.email)
        .single()
      
      if (existente) {
        console.log(`✅ Usuário já existe: ${existente.email}`)
        return existente
      }
    } else {
      console.log(`✅ Usuário criado: ${data[0].email}`)
      return data[0]
    }
  } catch (err) {
    console.log(`❌ Erro inesperado: ${err.message}`)
  }
  
  return null
}

async function criarCupomTeste() {
  console.log('\n🎫 Criando cupom de teste...')
  
  const cupomTeste = {
    id: crypto.randomUUID(),
    codigo: 'TESTE2024',
    parceira_nome: 'Parceira Teste',
    parceira_email: 'parceira@teste.com',
    percentual_comissao: 10,
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  try {
    const { data, error } = await supabase
      .from('cupons')
      .insert([cupomTeste])
      .select()
    
    if (error) {
      console.log(`❌ Erro ao criar cupom: ${error.message}`)
    } else {
      console.log(`✅ Cupom criado: ${data[0].codigo}`)
      return data[0]
    }
  } catch (err) {
    console.log(`❌ Erro inesperado: ${err.message}`)
  }
  
  return null
}

async function criarClienteTeste(userId) {
  if (!userId) {
    console.log('❌ Não é possível criar cliente sem usuário')
    return null
  }
  
  console.log('\n👥 Criando cliente de teste...')
  
  const clienteTeste = {
    id: crypto.randomUUID(),
    user_id: userId,
    nome: 'Cliente Teste',
    email: 'cliente@teste.com',
    telefone: '(11) 99999-9999',
    data_nascimento: '1990-01-01',
    observacoes: 'Cliente criado para teste do sistema',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteTeste])
      .select()
    
    if (error) {
      console.log(`❌ Erro ao criar cliente: ${error.message}`)
    } else {
      console.log(`✅ Cliente criado: ${data[0].nome}`)
      return data[0]
    }
  } catch (err) {
    console.log(`❌ Erro inesperado: ${err.message}`)
  }
  
  return null
}

async function listarDados() {
  console.log('\n📊 Listando dados atuais do banco...\n')
  
  // Lista usuários
  try {
    const { data: usuarios } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (usuarios && usuarios.length > 0) {
      console.log(`👤 Usuários (${usuarios.length}):`)
      usuarios.forEach(u => {
        console.log(`   • ${u.nome} (${u.email}) - Admin: ${u.is_admin ? 'Sim' : 'Não'}`)
      })
    } else {
      console.log('👤 Usuários: Nenhum encontrado')
    }
  } catch (err) {
    console.log(`❌ Erro ao listar usuários: ${err.message}`)
  }
  
  // Lista cupons
  try {
    const { data: cupons } = await supabase
      .from('cupons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (cupons && cupons.length > 0) {
      console.log(`\n🎫 Cupons (${cupons.length}):`)
      cupons.forEach(c => {
        console.log(`   • ${c.codigo} - ${c.parceira_nome} (${c.percentual_comissao}%) - ${c.ativo ? 'Ativo' : 'Inativo'}`)
      })
    } else {
      console.log('\n🎫 Cupons: Nenhum encontrado')
    }
  } catch (err) {
    console.log(`❌ Erro ao listar cupons: ${err.message}`)
  }
  
  // Lista clientes
  try {
    const { data: clientes } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (clientes && clientes.length > 0) {
      console.log(`\n👥 Clientes (${clientes.length}):`)
      clientes.forEach(c => {
        console.log(`   • ${c.nome} (${c.email || 'Sem email'}) - Tel: ${c.telefone || 'Sem telefone'}`)
      })
    } else {
      console.log('\n👥 Clientes: Nenhum encontrado')
    }
  } catch (err) {
    console.log(`❌ Erro ao listar clientes: ${err.message}`)
  }
}

async function main() {
  console.log('🚀 Verificando e configurando banco de dados CíliosClick\n')
  
  await verificarTabelas()
  
  const usuario = await criarUsuarioTeste()
  const cupom = await criarCupomTeste()
  
  if (usuario) {
    await criarClienteTeste(usuario.id)
  }
  
  await listarDados()
  
  console.log('\n✅ Verificação finalizada!')
  console.log('\n📝 Credenciais de teste:')
  console.log('   Email: admin@ciliosclick.com')
  console.log('   (Use qualquer senha - sistema em desenvolvimento)')
}

main().catch(console.error)