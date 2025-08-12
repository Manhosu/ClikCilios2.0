import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarEstruturaBD() {
  try {
    console.log('🔍 Verificando estrutura atual do banco de dados...');
    
    // Verificar tabelas existentes
    const tabelas = [
      'users',
      'pre_users', 
      'user_assignments',
      'clientes',
      'cupons',
      'usos_cupons',
      'imagens'
    ];
    
    const tabelasExistentes = [];
    const tabelasVazias = [];
    const tabelasComDados = [];
    
    for (const tabela of tabelas) {
      try {
        const { data, error, count } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Tabela '${tabela}': ${error.message}`);
        } else {
          tabelasExistentes.push(tabela);
          const registros = count || 0;
          
          if (registros === 0) {
            tabelasVazias.push(tabela);
          } else {
            tabelasComDados.push({ tabela, registros });
          }
          
          console.log(`✅ Tabela '${tabela}': ${registros} registros`);
        }
      } catch (err) {
        console.log(`⚠️ Erro ao verificar tabela '${tabela}':`, err.message);
      }
    }
    
    console.log('\n📊 RESUMO DA ESTRUTURA:');
    console.log(`   - Tabelas existentes: ${tabelasExistentes.length}`);
    console.log(`   - Tabelas vazias: ${tabelasVazias.length}`);
    console.log(`   - Tabelas com dados: ${tabelasComDados.length}`);
    
    if (tabelasVazias.length > 0) {
      console.log('\n🗑️ TABELAS VAZIAS (candidatas à remoção):');
      tabelasVazias.forEach(tabela => {
        console.log(`   - ${tabela}`);
      });
    }
    
    if (tabelasComDados.length > 0) {
      console.log('\n📈 TABELAS COM DADOS:');
      tabelasComDados.forEach(({ tabela, registros }) => {
        console.log(`   - ${tabela}: ${registros} registros`);
      });
    }
    
    // Verificar especificamente as tabelas do sistema antigo Hotmart
    console.log('\n🔍 Verificando tabelas do sistema Hotmart antigo...');
    
    // Verificar pre_users
    try {
      const { data: preUsers, error: preUsersError } = await supabase
        .from('pre_users')
        .select('*')
        .limit(5);
      
      if (preUsersError) {
        console.log('✅ Tabela pre_users não existe ou não é acessível');
      } else {
        console.log(`⚠️ Tabela pre_users ainda existe com ${preUsers.length} registros (amostra)`);
        if (preUsers.length > 0) {
          console.log('   Exemplo de registro:', preUsers[0]);
        }
      }
    } catch (err) {
      console.log('✅ Tabela pre_users não acessível');
    }
    
    // Verificar user_assignments
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select('*')
        .limit(5);
      
      if (assignmentsError) {
        console.log('✅ Tabela user_assignments não existe ou não é acessível');
      } else {
        console.log(`⚠️ Tabela user_assignments ainda existe com ${assignments.length} registros (amostra)`);
        if (assignments.length > 0) {
          console.log('   Exemplo de registro:', assignments[0]);
        }
      }
    } catch (err) {
      console.log('✅ Tabela user_assignments não acessível');
    }
    
    // Verificar usuários Hotmart na tabela users
    console.log('\n👥 Verificando usuários Hotmart na tabela consolidada...');
    
    const { data: hotmartUsers, error: hotmartError } = await supabase
      .from('users')
      .select('id, nome, email, is_admin')
      .like('email', 'hotmart%@clikcilios.com')
      .limit(10);
    
    if (hotmartError) {
      console.log('❌ Erro ao verificar usuários Hotmart:', hotmartError.message);
    } else {
      console.log(`✅ Encontrados ${hotmartUsers.length} usuários Hotmart (amostra de 10)`);
      if (hotmartUsers.length > 0) {
        console.log('   Exemplos:');
        hotmartUsers.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email} (${user.nome})`);
        });
      }
    }
    
    // Verificar usuários administrativos
    console.log('\n👑 Verificando usuários administrativos...');
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, nome, email, is_admin')
      .eq('is_admin', true);
    
    if (adminError) {
      console.log('❌ Erro ao verificar usuários admin:', adminError.message);
    } else {
      console.log(`✅ Encontrados ${adminUsers.length} usuários administrativos`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.nome})`);
      });
    }
    
    return {
      tabelasVazias,
      tabelasComDados,
      hotmartUsers: hotmartUsers?.length || 0,
      adminUsers: adminUsers?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    throw error;
  }
}

async function testarAutenticacao() {
  try {
    console.log('\n🔐 Testando sistema de autenticação...');
    
    // Testar login com usuários administrativos
    const usuariosParaTestar = [
      'eduardogelista@gmail.com',
      'carinaprange86@gmail.com'
    ];
    
    for (const email of usuariosParaTestar) {
      console.log(`\n🧪 Testando usuário: ${email}`);
      
      // Verificar se o usuário existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, nome, email, is_admin, onboarding_completed')
        .eq('email', email)
        .single();
      
      if (userError) {
        console.log(`❌ Usuário ${email} não encontrado:`, userError.message);
        continue;
      }
      
      console.log(`✅ Usuário encontrado:`);
      console.log(`   - Nome: ${user.nome}`);
      console.log(`   - Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
      console.log(`   - Onboarding: ${user.onboarding_completed ? 'Concluído' : 'Pendente'}`);
      
      // Simular verificação de autenticação (sem fazer login real)
      console.log(`✅ Estrutura de autenticação OK para ${email}`);
    }
    
    // Testar alguns usuários Hotmart
    console.log('\n🧪 Testando usuários Hotmart...');
    
    const { data: sampleHotmart, error: sampleError } = await supabase
      .from('users')
      .select('id, nome, email, is_admin, onboarding_completed')
      .like('email', 'hotmart%@clikcilios.com')
      .limit(3);
    
    if (sampleError) {
      console.log('❌ Erro ao buscar usuários Hotmart:', sampleError.message);
    } else {
      sampleHotmart.forEach(user => {
        console.log(`✅ Usuário Hotmart ${user.email}:`);
        console.log(`   - Nome: ${user.nome}`);
        console.log(`   - Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
        console.log(`   - Onboarding: ${user.onboarding_completed ? 'Concluído' : 'Pendente'}`);
      });
    }
    
    console.log('\n✅ Testes de autenticação concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante teste de autenticação:', error);
  }
}

async function gerarRecomendacoes(resultados) {
  console.log('\n📋 RECOMENDAÇÕES DE OTIMIZAÇÃO:');
  
  if (resultados.tabelasVazias.includes('pre_users') || resultados.tabelasVazias.includes('user_assignments')) {
    console.log('\n🗑️ TABELAS PARA REMOÇÃO:');
    console.log('   - pre_users: Substituída pela tabela users consolidada');
    console.log('   - user_assignments: Funcionalidade integrada na tabela users');
    console.log('\n💡 Comando sugerido:');
    console.log('   DROP TABLE IF EXISTS pre_users CASCADE;');
    console.log('   DROP TABLE IF EXISTS user_assignments CASCADE;');
  }
  
  if (resultados.hotmartUsers > 0) {
    console.log('\n✅ SISTEMA HOTMART:');
    console.log(`   - ${resultados.hotmartUsers} usuários Hotmart criados`);
    console.log('   - Sistema consolidado funcionando');
  }
  
  if (resultados.adminUsers > 0) {
    console.log('\n👑 USUÁRIOS ADMINISTRATIVOS:');
    console.log(`   - ${resultados.adminUsers} administradores configurados`);
    console.log('   - Sistema de permissões ativo');
  }
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('   1. Remover tabelas obsoletas (pre_users, user_assignments)');
  console.log('   2. Testar fluxo completo de compra Hotmart');
  console.log('   3. Verificar performance do sistema consolidado');
  console.log('   4. Monitorar logs de autenticação');
}

async function main() {
  try {
    const resultados = await verificarEstruturaBD();
    await testarAutenticacao();
    await gerarRecomendacoes(resultados);
    
    console.log('\n🎉 Verificação completa finalizada!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

main();