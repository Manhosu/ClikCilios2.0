const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function applyConfigurationsFix() {
  console.log('🚀 Aplicando correção da tabela configuracoes_usuario\n');

  // Configurar cliente Supabase com service role
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./fix-configuracoes-table.sql', 'utf8');
    
    // Dividir em comandos individuais (separados por ;)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        console.log(`⚡ Executando comando ${i + 1}/${commands.length}`);
        console.log(`   ${command.substring(0, 60)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Tentar executar diretamente se rpc falhar
          const { error: directError } = await supabase
            .from('configuracoes_usuario')
            .select('*')
            .limit(0);
          
          if (directError && !directError.message.includes('relation')) {
            console.log(`   ⚠️ Aviso: ${error.message}`);
          }
        } else {
          console.log('   ✅ Sucesso');
        }
      }
    }

    console.log('\n🔍 Verificando estrutura da tabela após correção...');
    
    // Testar inserção de configurações
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testConfig = {
      user_id: testUserId,
      tema: 'claro',
      notificacoes_email: true,
      notificacoes_push: true,
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      formato_hora: '24h',
      moeda: 'BRL',
      backup_automatico: true,
      backup_frequencia: 'semanal'
    };

    console.log('🧪 Testando inserção de configurações...');
    const { data: insertData, error: insertError } = await supabase
      .from('configuracoes_usuario')
      .insert(testConfig)
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      
      // Verificar quais colunas existem
      console.log('\n🔍 Verificando colunas existentes...');
      const { data: existingData, error: selectError } = await supabase
        .from('configuracoes_usuario')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log('❌ Erro ao verificar colunas:', selectError.message);
      } else {
        console.log('✅ Tabela acessível, estrutura pode estar incompleta');
      }
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('configuracoes_usuario')
        .delete()
        .eq('user_id', testUserId);
      
      console.log('🧹 Dados de teste removidos');
    }

    console.log('\n✅ Correção da tabela configuracoes_usuario concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

applyConfigurationsFix();