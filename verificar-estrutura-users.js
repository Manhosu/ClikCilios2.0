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

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    // Verificar alguns usuários específicos
    const emailsParaVerificar = [
      'carinaprange86@gmail.com',
      'eduardogelista@gmail.com'
    ];
    
    for (const email of emailsParaVerificar) {
      console.log(`\n📧 Verificando: ${email}`);
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
      
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log(`📊 Encontrados ${users.length} registros:`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Nome: ${user.nome}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Admin: ${user.is_admin}`);
          console.log(`      Onboarding: ${user.onboarding_completed}`);
          console.log(`      Criado em: ${user.created_at}`);
        });
      }
    }
    
    // Verificar usuários Hotmart
    console.log('\n🔍 Verificando usuários Hotmart...');
    
    const { data: hotmartUsers, error: hotmartError } = await supabase
      .from('users')
      .select('id, nome, email, created_at')
      .like('email', 'hotmart%@clikcilios.com')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (hotmartError) {
      console.log(`❌ Erro ao buscar usuários Hotmart: ${hotmartError.message}`);
    } else {
      console.log(`📊 Encontrados ${hotmartUsers.length} usuários Hotmart (últimos 10):`);
      hotmartUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.nome}`);
      });
    }
    
    // Verificar duplicatas por email
    console.log('\n🔍 Verificando duplicatas por email...');
    
    const { data: duplicatas, error: duplicatasError } = await supabase
      .rpc('get_duplicate_emails');
    
    if (duplicatasError) {
      console.log('⚠️ Função get_duplicate_emails não existe, verificando manualmente...');
      
      // Verificação manual de duplicatas
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('email')
        .order('email');
      
      if (allError) {
        console.log(`❌ Erro ao buscar todos os usuários: ${allError.message}`);
      } else {
        const emailCounts = {};
        allUsers.forEach(user => {
          emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
        });
        
        const duplicados = Object.entries(emailCounts)
          .filter(([email, count]) => count > 1)
          .sort((a, b) => b[1] - a[1]);
        
        if (duplicados.length > 0) {
          console.log(`⚠️ Encontradas ${duplicados.length} duplicatas:`);
          duplicados.slice(0, 10).forEach(([email, count]) => {
            console.log(`   - ${email}: ${count} registros`);
          });
        } else {
          console.log('✅ Nenhuma duplicata encontrada');
        }
      }
    } else {
      console.log('📊 Duplicatas encontradas:', duplicatas);
    }
    
    // Estatísticas gerais
    console.log('\n📊 Estatísticas gerais da tabela users...');
    
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: adminUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true);
    
    const { count: hotmartCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .like('email', 'hotmart%@clikcilios.com');
    
    console.log(`   - Total de usuários: ${totalUsers}`);
    console.log(`   - Administradores: ${adminUsers}`);
    console.log(`   - Usuários Hotmart: ${hotmartCount}`);
    console.log(`   - Usuários regulares: ${totalUsers - adminUsers - hotmartCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

async function testarLoginSimples() {
  try {
    console.log('\n🔐 Testando login simples...');
    
    // Teste com primeiro resultado apenas
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, email, is_admin, onboarding_completed')
      .eq('email', 'carinaprange86@gmail.com')
      .limit(1)
      .maybeSingle(); // Use maybeSingle em vez de single
    
    if (error) {
      console.log(`❌ Erro no login: ${error.message}`);
    } else if (!user) {
      console.log('⚠️ Usuário não encontrado');
    } else {
      console.log('✅ Login bem-sucedido:');
      console.log(`   - Nome: ${user.nome}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Admin: ${user.is_admin}`);
      console.log(`   - Onboarding: ${user.onboarding_completed}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste de login:', error);
  }
}

async function main() {
  try {
    await verificarEstrutura();
    await testarLoginSimples();
    
    console.log('\n🎉 Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

main();