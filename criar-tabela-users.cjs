const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const adminEmail = 'carinaprange86@gmail.com';
const adminNome = 'Carina Prange';

/**
 * Gerar senha segura
 */
function gerarSenhaSegura() {
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%&*'
  };
  
  let senha = '';
  
  // Garantir pelo menos um de cada tipo
  senha += chars.upper[Math.floor(Math.random() * chars.upper.length)];
  senha += chars.lower[Math.floor(Math.random() * chars.lower.length)];
  senha += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
  senha += chars.special[Math.floor(Math.random() * chars.special.length)];
  
  // Completar até 12 caracteres
  const allChars = chars.upper + chars.lower + chars.numbers + chars.special;
  for (let i = 4; i < 12; i++) {
    senha += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar
  return senha.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Verificar se tabela users existe e tem a coluna is_admin
 */
async function verificarTabelaUsers() {
  console.log('🔍 Verificando tabela users...');
  
  try {
    // Tentar fazer uma consulta simples na tabela users
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email, is_admin, onboarding_completed')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('❌ Tabela users não existe!');
        console.log('📝 Você precisa executar as migrações SQL manualmente no Supabase Dashboard.');
        console.log('🔗 Acesse: https://supabase.com/dashboard/project/gguxeqpayaangiplggme/sql');
        console.log('📋 Execute o SQL do arquivo DEPLOY_INSTRUCTIONS.md (linhas 65-143)');
        return false;
      } else if (error.message.includes('column "is_admin" does not exist')) {
        console.log('❌ Tabela users existe mas não tem a coluna is_admin!');
        console.log('📝 Você precisa adicionar a coluna is_admin.');
        return false;
      } else {
        console.error('❌ Erro ao verificar tabela users:', error);
        return false;
      }
    }
    
    console.log('✅ Tabela users existe e está configurada corretamente!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado ao verificar tabela:', err.message);
    return false;
  }
}

/**
 * Criar usuário administrador
 */
async function criarUsuarioAdmin() {
  console.log('👤 Criando usuário administrador...');
  console.log(`📧 Email: ${adminEmail}`);
  
  const senha = gerarSenhaSegura();
  
  try {
    // 1. Criar usuário no Auth
    console.log('🔐 Criando usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: adminNome
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe no Auth, tentando atualizar...');
        
        // Tentar buscar o usuário existente
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('❌ Erro ao listar usuários:', listError);
          return null;
        }
        
        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        
        if (existingUser) {
          console.log('✅ Usuário encontrado no Auth:', existingUser.id);
          
          // Atualizar senha
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: senha }
          );
          
          if (updateError) {
            console.error('❌ Erro ao atualizar senha:', updateError);
          } else {
            console.log('✅ Senha atualizada com sucesso!');
          }
          
          // Usar o usuário existente
          authData = { user: existingUser };
        } else {
          console.error('❌ Usuário não encontrado após busca');
          return null;
        }
      } else {
        console.error('❌ Erro ao criar usuário no Auth:', authError);
        return null;
      }
    } else {
      console.log('✅ Usuário criado no Auth:', authData.user.id);
    }
    
    // 2. Inserir/atualizar na tabela users
    console.log('📝 Inserindo/atualizando na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        nome: adminNome,
        email: adminEmail,
        is_admin: true,
        onboarding_completed: true
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erro ao inserir na tabela users:', userError);
      return null;
    }
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📊 Dados do usuário:');
    console.log(`   - ID: ${userData.id}`);
    console.log(`   - Nome: ${userData.nome}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Admin: ${userData.is_admin ? 'SIM' : 'NÃO'}`);
    console.log(`   - Onboarding: ${userData.onboarding_completed ? 'COMPLETO' : 'PENDENTE'}`);
    
    return {
      usuario: userData,
      senha: senha
    };
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    return null;
  }
}

/**
 * Testar login do usuário
 */
async function testarLogin(email, senha) {
  console.log('🧪 Testando login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      return false;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`   - User ID: ${data.user.id}`);
    console.log(`   - Email: ${data.user.email}`);
    
    // Fazer logout
    await supabase.auth.signOut();
    
    return true;
  } catch (err) {
    console.error('❌ Erro no teste de login:', err.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando configuração do usuário administrador...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar tabela users
    const tabelaOk = await verificarTabelaUsers();
    if (!tabelaOk) {
      console.log('❌ Tabela users não está configurada corretamente. Abortando...');
      return;
    }
    
    // 2. Criar usuário administrador
    const resultado = await criarUsuarioAdmin();
    if (!resultado) {
      console.log('❌ Falha ao criar usuário administrador. Abortando...');
      return;
    }
    
    // 3. Testar login
    const loginOk = await testarLogin(adminEmail, resultado.senha);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('=' .repeat(60));
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Senha:', resultado.senha);
    console.log('👤 Nome:', adminNome);
    console.log('🔐 Admin:', 'SIM');
    console.log('🧪 Login testado:', loginOk ? 'SIM' : 'NÃO');
    console.log('=' .repeat(60));
    
    if (loginOk) {
      console.log('✅ Sistema pronto para uso!');
      console.log('🌐 Acesse o sistema e faça login com as credenciais acima.');
    } else {
      console.log('⚠️  Sistema criado, mas login não testado com sucesso.');
      console.log('   Tente fazer login manualmente no sistema.');
    }
    
  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { verificarTabelaUsers, criarUsuarioAdmin, testarLogin };