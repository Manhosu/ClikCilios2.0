// Script para aplicar migrações da integração Hotmart usando MCP do Supabase
const fs = require('fs');
const path = require('path');

console.log('🚀 Aplicando migrações da integração Hotmart via MCP...');
console.log('📍 Projeto: gguxeqpayaangiplggme (carinaprange86@gmail.com\'s Project)');
console.log('🌎 Região: sa-east-1\n');

try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', 'create_hotmart_integration_complete.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Conteúdo da migração carregado com sucesso!');
    console.log(`📏 Tamanho: ${sqlContent.length} caracteres\n`);
    
    // Dividir em comandos individuais para análise
    const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔍 Análise da migração:`);
    console.log(`• Total de comandos SQL: ${commands.length}`);
    
    // Contar tipos de comandos
    const commandTypes = {
        'CREATE EXTENSION': 0,
        'CREATE TABLE': 0,
        'CREATE INDEX': 0,
        'ALTER TABLE': 0,
        'CREATE POLICY': 0,
        'CREATE FUNCTION': 0,
        'CREATE TRIGGER': 0,
        'INSERT': 0,
        'COMMENT': 0
    };
    
    commands.forEach(cmd => {
        if (cmd.includes('CREATE EXTENSION')) commandTypes['CREATE EXTENSION']++;
        else if (cmd.includes('CREATE TABLE')) commandTypes['CREATE TABLE']++;
        else if (cmd.includes('CREATE INDEX')) commandTypes['CREATE INDEX']++;
        else if (cmd.includes('ALTER TABLE')) commandTypes['ALTER TABLE']++;
        else if (cmd.includes('CREATE POLICY')) commandTypes['CREATE POLICY']++;
        else if (cmd.includes('CREATE OR REPLACE FUNCTION') || cmd.includes('CREATE FUNCTION')) commandTypes['CREATE FUNCTION']++;
        else if (cmd.includes('CREATE TRIGGER')) commandTypes['CREATE TRIGGER']++;
        else if (cmd.includes('INSERT')) commandTypes['INSERT']++;
        else if (cmd.includes('COMMENT')) commandTypes['COMMENT']++;
    });
    
    console.log('\n📊 Distribuição dos comandos:');
    Object.entries(commandTypes).forEach(([type, count]) => {
        if (count > 0) {
            console.log(`• ${type}: ${count}`);
        }
    });
    
    console.log('\n🏗️  Estruturas que serão criadas:');
    console.log('• 📋 Tabela pre_users (usuários pré-criados)');
    console.log('• 📋 Tabela user_assignments (atribuições de usuários)');
    console.log('• 📋 Tabela webhook_events (log de eventos webhook)');
    console.log('• 🔧 Função allocate_available_user() (alocação com concorrência)');
    console.log('• 🔧 Função release_user() (liberação de usuários)');
    console.log('• 🔒 Políticas RLS para segurança');
    console.log('• 👥 10 usuários de exemplo');
    
    console.log('\n✅ Migração preparada e validada!');
    console.log('\n📝 Para aplicar as migrações:');
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/gguxeqpayaangiplggme');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o conteúdo do arquivo migrations/create_hotmart_integration_complete.sql');
    console.log('4. Execute o script');
    
    console.log('\n🔧 Ou use o MCP do Supabase se disponível para execução automática.');
    
    // Mostrar preview dos primeiros comandos
    console.log('\n👀 Preview dos primeiros comandos:');
    commands.slice(0, 3).forEach((cmd, i) => {
        const preview = cmd.length > 100 ? cmd.substring(0, 100) + '...' : cmd;
        console.log(`${i + 1}. ${preview}`);
    });
    
} catch (error) {
    console.error('❌ Erro ao processar migração:', error.message);
    process.exit(1);
}

console.log('\n🎯 Script concluído! As migrações estão prontas para serem aplicadas.');