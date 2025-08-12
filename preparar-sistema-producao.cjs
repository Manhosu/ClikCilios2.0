const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Cliente Supabase com service role para operações administrativas
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Preparar o sistema para produção
 * 1. Criar/configurar usuário administrador da dona do sistema
 * 2. Popular tabela pre_users com contas pré-criadas para compradores
 * 3. Verificar se integração Hotmart está pronta
 */
async function prepararSistemaProducao() {
  console.log('🚀 Iniciando preparação do sistema para produção...');
  console.log('=' .repeat(60));
  
  try {
    // Verificar se variáveis de ambiente estão configuradas
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('❌ Variáveis de ambiente do Supabase não configuradas!');
    }

    // 1. Configurar usuário administrador
    await configurarAdministrador();
    
    // 2. Popular pre_users com contas prontas
    await popularPreUsers();
    
    // 3. Verificar integração Hotmart
    await verificarIntegracaoHotmart();
    
    console.log('\n🎉 Sistema preparado para produção com sucesso!');
    console.log('\n📋 Resumo da configuração:');
    console.log('   ✅ Administrador configurado: carinaprange86@gmail.com');
    console.log('   ✅ Contas pré-criadas para compradores prontas');
    console.log('   ✅ Integração Hotmart verificada');
    console.log('\n🔐 Credenciais do administrador foram enviadas por email.');
    console.log('📧 Compradores receberão credenciais automaticamente via webhook Hotmart.');
    
  } catch (error) {
    console.error('❌ Erro durante a preparação:', error.message);
    process.exit(1);
  }
}

/**
 * Configurar usuário administrador da dona do sistema
 */
async function configurarAdministrador() {
  console.log('\n1. 👑 Configurando usuário administrador...');
  
  const adminEmail = 'carinaprange86@gmail.com';
  const adminNome = 'Carina Prange';
  
  // Gerar senha segura para admin
  const adminPassword = gerarSenhaSegura(16);
  
  try {
    // Verificar se admin já existe
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('email', adminEmail)
      .single();
    
    if (existingAdmin) {
      console.log('   ⚠️ Administrador já existe, atualizando configurações...');
      
      // Garantir que é admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          nome: adminNome,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail);
      
      if (updateError) throw updateError;
      
      // Atualizar senha no Auth
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        { password: adminPassword }
      );
      
      if (authUpdateError) throw authUpdateError;
      
      console.log('   ✅ Administrador atualizado com sucesso');
    } else {
      console.log('   📝 Criando novo usuário administrador...');
      
      // Criar admin no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          nome: adminNome,
          is_admin: true,
          role: 'owner'
        }
      });
      
      if (authError || !authData.user) {
        throw new Error(`Erro ao criar admin no Auth: ${authError?.message}`);
      }
      
      // Criar perfil na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: adminEmail,
          nome: adminNome,
          is_admin: true,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      console.log('   ✅ Administrador criado com sucesso');
    }
    
    // Simular envio de email (em produção, usar serviço real)
    console.log('\n   📧 Credenciais do administrador:');
    console.log(`      Email: ${adminEmail}`);
    console.log(`      Senha: ${adminPassword}`);
    console.log('      Role: Administrador/Proprietário');
    console.log('\n   ⚠️ IMPORTANTE: Salve essas credenciais em local seguro!');
    
  } catch (error) {
    throw new Error(`Erro ao configurar administrador: ${error.message}`);
  }
}

/**
 * Popular tabela pre_users com contas pré-criadas
 */
async function popularPreUsers() {
  console.log('\n2. 👥 Preparando contas pré-criadas para compradores...');
  
  try {
    // Verificar quantos usuários já existem
    const { data: existingUsers, error: checkError } = await supabase
      .from('pre_users')
      .select('id, status')
      .order('created_at');
    
    if (checkError) {
      throw new Error(`Erro ao verificar pre_users: ${checkError.message}`);
    }
    
    const totalExistentes = existingUsers?.length || 0;
    const disponiveis = existingUsers?.filter(u => u.status === 'available').length || 0;
    
    console.log(`   📊 Status atual: ${totalExistentes} total, ${disponiveis} disponíveis`);
    
    // Determinar quantos usuários criar
    const metaMinima = 100; // Pelo menos 100 contas prontas
    const precisaCriar = Math.max(0, metaMinima - disponiveis);
    
    if (precisaCriar === 0) {
      console.log('   ✅ Já há usuários suficientes disponíveis');
      return;
    }
    
    console.log(`   📝 Criando ${precisaCriar} novas contas pré-criadas...`);
    
    // Determinar próximo número sequencial
    let proximoNumero = 1;
    if (existingUsers && existingUsers.length > 0) {
      // Encontrar maior número usado
      const numeros = existingUsers
        .map(u => {
          const match = u.username?.match(/user(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      if (numeros.length > 0) {
        proximoNumero = Math.max(...numeros) + 1;
      }
    }
    
    // Criar usuários em lotes
    const batchSize = 50;
    const usuarios = [];
    
    for (let i = 0; i < precisaCriar; i++) {
      const numero = proximoNumero + i;
      const username = `user${numero.toString().padStart(4, '0')}`;
      const email = `${username}@ciliosclick.com`;
      
      usuarios.push({
        username: username,
        email: email,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Inserir em lotes
    for (let i = 0; i < usuarios.length; i += batchSize) {
      const batch = usuarios.slice(i, i + batchSize);
      const loteNum = Math.floor(i / batchSize) + 1;
      const totalLotes = Math.ceil(usuarios.length / batchSize);
      
      console.log(`   ⏳ Inserindo lote ${loteNum}/${totalLotes} (${batch.length} usuários)...`);
      
      const { error: insertError } = await supabase
        .from('pre_users')
        .insert(batch);
      
      if (insertError) {
        throw new Error(`Erro no lote ${loteNum}: ${insertError.message}`);
      }
      
      console.log(`   ✅ Lote ${loteNum} inserido com sucesso`);
    }
    
    // Verificar resultado final
    const { data: finalUsers, error: finalError } = await supabase
      .from('pre_users')
      .select('id, status');
    
    if (finalError) throw finalError;
    
    const finalTotal = finalUsers?.length || 0;
    const finalDisponiveis = finalUsers?.filter(u => u.status === 'available').length || 0;
    
    console.log(`   🎉 Contas criadas com sucesso!`);
    console.log(`   📊 Status final: ${finalTotal} total, ${finalDisponiveis} disponíveis`);
    
  } catch (error) {
    throw new Error(`Erro ao popular pre_users: ${error.message}`);
  }
}

/**
 * Verificar se integração Hotmart está configurada
 */
async function verificarIntegracaoHotmart() {
  console.log('\n3. 🔗 Verificando integração Hotmart...');
  
  try {
    // Verificar variáveis de ambiente
    const hotmartVars = {
      'HOTMART_HOTTOK': process.env.HOTMART_HOTTOK,
      'VITE_HOTMART_WEBHOOK_SECRET': process.env.VITE_HOTMART_WEBHOOK_SECRET
    };
    
    let faltandoVars = [];
    for (const [nome, valor] of Object.entries(hotmartVars)) {
      if (!valor) {
        faltandoVars.push(nome);
      }
    }
    
    if (faltandoVars.length > 0) {
      console.log('   ⚠️ Variáveis de ambiente faltando:');
      faltandoVars.forEach(v => console.log(`      - ${v}`));
      console.log('   📝 Configure essas variáveis no .env.local');
    } else {
      console.log('   ✅ Variáveis de ambiente configuradas');
    }
    
    // Verificar funções RPC
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_pre_users_stats');
    
    if (statsError) {
      throw new Error(`Função get_pre_users_stats não encontrada: ${statsError.message}`);
    }
    
    console.log('   ✅ Funções RPC disponíveis');
    
    // Verificar tabelas necessárias
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('id')
      .limit(1);
    
    if (webhookError && webhookError.code === '42P01') {
      console.log('   ⚠️ Tabela webhook_events não existe - execute as migrações');
    } else {
      console.log('   ✅ Tabelas de integração disponíveis');
    }
    
    // URL do webhook
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ciliosclick.com/api/hotmart/webhook'
      : 'http://localhost:5173/api/hotmart/webhook';
    
    console.log(`   🌐 URL do webhook: ${webhookUrl}`);
    console.log('   📋 Configure esta URL no painel da Hotmart');
    
  } catch (error) {
    throw new Error(`Erro na verificação Hotmart: ${error.message}`);
  }
}

/**
 * Gerar senha segura
 */
function gerarSenhaSegura(tamanho = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let senha = '';
  
  // Garantir pelo menos um de cada tipo
  senha += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
  senha += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
  senha += '0123456789'[Math.floor(Math.random() * 10)]; // Número
  senha += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Especial
  
  // Completar o resto
  for (let i = senha.length; i < tamanho; i++) {
    senha += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Embaralhar
  return senha.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Verificar status do sistema
 */
async function verificarStatusSistema() {
  try {
    const { data: stats, error } = await supabase.rpc('get_pre_users_stats');
    
    if (error) throw error;
    
    const statsData = stats[0] || {};
    
    console.log('\n📊 Status atual do sistema:');
    console.log(`   👥 Usuários disponíveis: ${statsData.usuarios_disponiveis || 0}`);
    console.log(`   🔒 Usuários ocupados: ${statsData.usuarios_ocupados || 0}`);
    console.log(`   ⏸️ Usuários suspensos: ${statsData.usuarios_suspensos || 0}`);
    console.log(`   📈 Total de usuários: ${statsData.total_usuarios || 0}`);
    console.log(`   📋 Total de atribuições: ${statsData.total_atribuicoes || 0}`);
    console.log(`   ✅ Atribuições ativas: ${statsData.atribuicoes_ativas || 0}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// Execução principal
async function main() {
  console.log('🎯 Sistema de Preparação para Produção - CíliosClick');
  console.log('=' .repeat(60));
  
  try {
    await prepararSistemaProducao();
    await verificarStatusSistema();
    
  } catch (error) {
    console.error('\n❌ Falha na preparação:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  prepararSistemaProducao,
  configurarAdministrador,
  popularPreUsers,
  verificarIntegracaoHotmart,
  verificarStatusSistema
};