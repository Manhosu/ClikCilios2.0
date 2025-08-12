const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente Supabase com service role para operações administrativas
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Script para popular a tabela pre_users com usuários pré-criados
 * Cria 200 usuários com usernames sequenciais: user0001, user0002, etc.
 */
async function populatePreUsers() {
  console.log('🚀 Iniciando população de usuários pré-criados...');
  
  try {
    // Verifica se já existem usuários na tabela
    const { data: existingUsers, error: checkError } = await supabase
      .from('pre_users')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ Já existem usuários pré-criados na tabela.');
      const response = await askQuestion('Deseja continuar e adicionar mais usuários? (y/N): ');
      if (response.toLowerCase() !== 'y' && response.toLowerCase() !== 'yes') {
        console.log('❌ Operação cancelada pelo usuário.');
        return;
      }
    }
    
    // Gera array de usuários para inserção
    const users = [];
    const totalUsers = 200;
    
    for (let i = 1; i <= totalUsers; i++) {
      const username = `user${i.toString().padStart(4, '0')}`;
      const email = `${username}@ciliosclick.com`;
      
      users.push({
        username: username,
        email: email,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`📝 Preparando inserção de ${totalUsers} usuários...`);
    
    // Insere usuários em lotes de 50 para evitar timeouts
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      batches.push(users.slice(i, i + batchSize));
    }
    
    console.log(`📦 Inserindo em ${batches.length} lotes de ${batchSize} usuários...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`⏳ Processando lote ${i + 1}/${batches.length}...`);
      
      const { data, error } = await supabase
        .from('pre_users')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`❌ Erro no lote ${i + 1}:`, error);
        throw error;
      }
      
      console.log(`✅ Lote ${i + 1} inserido com sucesso (${data.length} usuários)`);
    }
    
    // Verifica o total final
    const { data: finalCount, error: countError } = await supabase
      .from('pre_users')
      .select('id', { count: 'exact' });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`\n🎉 População concluída com sucesso!`);
    console.log(`📊 Total de usuários pré-criados na tabela: ${finalCount.length}`);
    console.log(`\n📋 Exemplos de usuários criados:`);
    console.log(`   - user0001@ciliosclick.com`);
    console.log(`   - user0002@ciliosclick.com`);
    console.log(`   - ...`);
    console.log(`   - user0200@ciliosclick.com`);
    console.log(`\n✨ Os usuários estão prontos para serem alocados via webhook da Hotmart!`);
    
  } catch (error) {
    console.error('❌ Erro durante a população:', error);
    process.exit(1);
  }
}

/**
 * Função auxiliar para fazer perguntas no terminal
 */
function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Função para verificar o status atual dos usuários
 */
async function checkUsersStatus() {
  try {
    const { data: stats, error } = await supabase
      .from('pre_users')
      .select('status')
      .then(result => {
        if (result.error) throw result.error;
        
        const statusCount = result.data.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1;
          return acc;
        }, {});
        
        return { data: statusCount, error: null };
      });
    
    if (error) throw error;
    
    console.log('\n📊 Status atual dos usuários pré-criados:');
    console.log(`   🟢 Disponíveis: ${stats.available || 0}`);
    console.log(`   🔵 Ocupados: ${stats.occupied || 0}`);
    console.log(`   🔴 Suspensos: ${stats.suspended || 0}`);
    console.log(`   📈 Total: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  }
}

// Execução principal
async function main() {
  console.log('🎯 Script de População de Usuários Pré-criados - CíliosClick');
  console.log('=' .repeat(60));
  
  // Verifica variáveis de ambiente
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    console.error('   Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.');
    process.exit(1);
  }
  
  // Verifica status atual primeiro
  await checkUsersStatus();
  
  console.log('\n');
  
  // Executa a população
  await populatePreUsers();
  
  // Verifica status final
  await checkUsersStatus();
}

// Executa o script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  populatePreUsers,
  checkUsersStatus
};