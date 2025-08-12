/*
  Script: gerar-usuarios-reais.cjs
  Objetivo:
  - Parar de usar pre_users para acessos reais
  - Migrar automaticamente pre_users existentes (status=available) para usuários reais do Supabase Auth
  - Criar registros correspondentes em public.users
  - Se não houver pre_users, gerar N usuários reais novos

  Requisitos:
  - .env.local com VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
*/

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variáveis de ambiente faltando: VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Verifique seu .env.local e tente novamente.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function gerarSenha(tamanho = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+' // sem caracteres ambíguos
  let s = ''
  for (let i = 0; i < tamanho; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return s
}

function normalizarEmailPossivel(username) {
  if (!username) return null
  const base = String(username).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!base) return null
  return `${base}@ciliosclick.com`
}

async function verificarTabelaUsers() {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) {
    console.error('❌ Tabela public.users indisponível:', error.message)
    console.error('   Não foi possível prosseguir com a criação de registros em public.users.')
    process.exit(1)
  }
}

async function obterPreUsersDisponiveis(max = 1000) {
  try {
    // Não selecionar colunas específicas para evitar erro caso "email" não exista no schema atual
    const { data, error } = await supabase
      .from('pre_users')
      .select('*')
      .eq('status', 'available')
      .limit(max)

    if (error) {
      console.warn('⚠️  Não foi possível consultar pre_users (seguiremos sem migrar):', error.message)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('⚠️  Erro inesperado consultando pre_users:', e.message)
    return []
  }
}

async function criarUsuarioReal({ email, nome, password }) {
  // 1) Criar usuário no Auth
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  })
  if (authError) return { error: new Error('Auth error: ' + authError.message), code: authError?.status || authError?.name }

  const userId = created?.user?.id
  if (!userId) return { error: new Error('Auth user id não retornado') }

  // 2) Verificar se já existe linha em public.users para este id (gatilho pode ter criado)
  const check = await supabase.from('users').select('id,email').eq('id', userId).maybeSingle()
  if (check.data && !check.error) {
    // Já existe, opcionalmente atualizar nome
    await supabase.from('users').update({ nome: nome || email.split('@')[0] }).eq('id', userId)
    return { userId }
  }

  // 3) Criar/atualizar em public.users (usar apenas colunas básicas para compatibilidade)
  const payload = { id: userId, email, nome: nome || email.split('@')[0] }
  const upsertRes = await supabase.from('users').upsert(payload)
  if (upsertRes.error) {
    // Se der conflito por email, verificar se já existe com mesmo email
    if (String(upsertRes.error.message).toLowerCase().includes('duplicate key value')) {
      const byEmail = await supabase.from('users').select('id,email').eq('email', email).maybeSingle()
      if (byEmail.data && !byEmail.error) {
        // Já existe, considerar sucesso
        return { userId: byEmail.data.id }
      }
    }
    // Tenta insert simples como último recurso
    const insertRes = await supabase.from('users').insert(payload)
    if (insertRes.error) {
      return { error: new Error('public.users upsert/insert error: ' + insertRes.error.message) }
    }
  }

  return { userId }
}

async function marcarPreUserMigrado(preUserId, userId) {
  try {
    // Tenta atualizar status e metadata; se falhar, atualiza só status
    const meta = { migrated_to_user_id: userId, migrated_at: new Date().toISOString() }
    let { error } = await supabase
      .from('pre_users')
      .update({ status: 'occupied', metadata: meta })
      .eq('id', preUserId)

    if (error) {
      // Tenta somente status
      await supabase
        .from('pre_users')
        .update({ status: 'occupied' })
        .eq('id', preUserId)
    }
  } catch (_) {}
}

async function migrarPreUsersParaUsers() {
  const preUsers = await obterPreUsersDisponiveis()
  if (!preUsers.length) {
    console.log('ℹ️  Nenhum pre_user disponível para migrar. Pulando etapa de migração.')
    return { migrados: [] }
  }

  console.log(`🔄 Migrando ${preUsers.length} pre_users para Auth/public.users...`)

  const migrados = []
  for (const pu of preUsers) {
    const email = pu.email || normalizarEmailPossivel(pu.username) || normalizarEmailPossivel(pu.nome) || null
    if (!email) {
      console.warn(`⚠️  pre_user id=${pu.id} sem email/username válidos. Ignorando.`)
      continue
    }

    const password = gerarSenha(12)
    const nome = pu.nome || pu.username || email.split('@')[0]

    const { userId, error } = await criarUsuarioReal({ email, nome, password })
    if (error) {
      console.warn(`⚠️  Falha ao criar usuário real para ${email}: ${error.message}`)
      continue
    }

    await marcarPreUserMigrado(pu.id, userId)
    migrados.push({ email, password, userId, origem: 'pre_users' })
  }

  console.log(`✅ Migração concluída: ${migrados.length} usuários criados a partir de pre_users`)
  return { migrados }
}

function gerarSequencialEmail(i, dominio = 'ciliosclick.com') {
  const num = String(i).padStart(4, '0')
  return { email: `user${num}@${dominio}`, nome: `user${num}` }
}

function gerarEmailAleatorio(dominio = 'ciliosclick.com') {
  const rand = Math.random().toString(36).slice(2, 8)
  return { email: `user_${Date.now()}_${rand}@${dominio}`, nome: `user_${rand}` }
}

async function gerarUsuariosReaisNovos(qtd = 20) {
  console.log(`🔧 Gerando ${qtd} usuários reais novos (Auth + public.users) ...`)
  const criados = []

  for (let i = 1; i <= qtd; i++) {
    let base = gerarSequencialEmail(i)
    let tentativas = 0
    let criadoComSucesso = false

    while (tentativas < 3 && !criadoComSucesso) {
      const alvo = tentativas === 0 ? base : gerarEmailAleatorio()
      const password = gerarSenha(12)
      const { userId, error } = await criarUsuarioReal({ email: alvo.email, nome: alvo.nome, password })
      if (error) {
        if (String(error.message).includes('already been registered')) {
          tentativas++
          if (tentativas >= 3) {
            console.warn(`⚠️  Conflito de email persistente para base ${base.email}. Pulando.`)
          }
          continue
        } else {
          console.warn(`⚠️  Não foi possível criar ${alvo.email}: ${error.message}`)
          break
        }
      } else {
        criados.push({ email: alvo.email, password, userId, origem: 'novo' })
        criadoComSucesso = true
      }
    }
  }

  console.log(`✅ Geração concluída: ${criados.length} usuários criados`)
  return { criados }
}

async function main() {
  console.log('🚀 Iniciando correção automática: usar usuários reais do Supabase (Auth + public.users)')
  console.log(`📍 Projeto: ${SUPABASE_URL}`)

  await verificarTabelaUsers()

  const { migrados } = await migrarPreUsersParaUsers()

  // Se nada migrou, garanta criação de alguns usuários reais
  let criados = []
  if (!migrados.length) {
    const qtd = Number(process.env.GERAR_QTD || 20)
    const res = await gerarUsuariosReaisNovos(qtd)
    criados = res.criados
  }

  const total = migrados.length + criados.length
  if (!total) {
    console.log('ℹ️  Nenhum usuário novo foi criado (possíveis conflitos de email).')
  }

  // Salvar relatório com emails/senhas gerados
  const relatorio = { quando: new Date().toISOString(), projeto: SUPABASE_URL, migrados, criados }
  try {
    fs.writeFileSync('relatorio_usuarios_reais.json', JSON.stringify(relatorio, null, 2), 'utf8')
    console.log('📝 Relatório salvo em relatorio_usuarios_reais.json')
  } catch (e) {
    console.warn('⚠️  Não foi possível salvar relatório local:', e.message)
  }

  console.log('\n📋 Resumo:')
  if (migrados.length) console.log(`- Migrados de pre_users: ${migrados.length}`)
  if (criados.length) console.log(`- Criados novos: ${criados.length}`)
  console.log('🎯 Concluído! Agora o sistema usa somente usuários reais.')
}

main().catch(err => {
  console.error('❌ Erro geral:', err?.message || err)
  process.exit(1)
})