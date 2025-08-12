const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const adminEmail = 'carinaprange86@gmail.com';
const adminNome = 'Carina Prange';

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
 * Verificar se admin existe e criar se necessário
 */
async function verificarECriarAdmin() {
  console.log('🔍 Verificando usuário administrador...');
  console.log(`📧 Email: ${adminEmail}`);
  
  try {
    // Verificar se existe na tabela users
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users:');
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Nome: ${existingUser.nome}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Admin: ${existingUser.is_admin ? 'SIM' : 'NÃO'}`);
      
      // Testar login se possível
      console.log('\n🔐 Tentando fazer login de teste...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: 'senha_teste' // Isso vai falhar, mas nos dará informações
      });
      
      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          console.log('⚠️  Usuário existe no Auth, mas senha não conhecida');
        } else if (loginError.message.includes('Email not confirmed')) {
          console.log('⚠️  Usuário existe no Auth, mas email não confirmado');
        } else {
          console.log(`⚠️  Erro no login: ${loginError.message}`);
        }
      }
      
      return existingUser;
    }
    
    // Se não existe, criar novo
    console.log('📝 Usuário não encontrado, criando novo...');
    
    const adminPassword = gerarSenhaSegura(16);
    
    // Criar usuário no Auth (simulado - requer service role)
    console.log('⚠️  Para criar usuário no Auth, é necessário service role key');
    console.log('   Vou criar apenas na tabela users por enquanto');
    
    // Criar na tabela users
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(), // Gerar UUID temporário
        email: adminEmail,
        nome: adminNome,
        is_admin: true,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erro ao criar usuário: ${createError.message}`);
      return null;
    }
    
    console.log('✅ Usuário criado na tabela users!');
    console.log(`   - ID: ${newUser.id}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Nome: ${newUser.nome}`);
    console.log(`   - Senha gerada: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANTE: Para login funcionar, o usuário deve ser criado no Supabase Auth também');
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

/**
 * Verificar estrutura da tabela users
 */
async function verificarEstrutura() {
  console.log('\n🔍 Verificando estrutura da tabela users...');
  
  try {
    // Tentar inserir um registro de teste para ver quais campos existem
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Erro ao acessar tabela: ${error.message}`);
      return;
    }
    
    console.log('✅ Tabela users acessível');
    
    if (data && data.length > 0) {
      console.log('📋 Colunas encontradas:', Object.keys(data[0]));
    } else {
      console.log('📭 Tabela vazia - não é possível determinar estrutura');
      console.log('   Tentando inserir registro de teste...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: 'teste@estrutura.com',
          nome: 'Teste Estrutura'
        });
      
      if (insertError) {
        console.log(`❌ Erro na inserção: ${insertError.message}`);
        console.log('   Isso nos ajuda a entender a estrutura da tabela');
      } else {
        console.log('✅ Inserção de teste bem-sucedida');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Verificação do Administrador - CíliosClick');
  console.log('=' .repeat(50));
  
  await verificarEstrutura();
  await verificarECriarAdmin();
  
  console.log('\n✅ Verificação concluída!');
}

main().catch(console.error);