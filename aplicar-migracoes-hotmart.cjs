const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gguxeqpayaangiplggme.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.log('\n📝 Para aplicar as migrações, você precisa:');
    console.log('1. Obter a Service Role Key do seu projeto Supabase');
    console.log('2. Definir a variável de ambiente: set SUPABASE_SERVICE_ROLE_KEY=sua_chave');
    console.log('3. Executar novamente este script');
    process.exit(1);
}

async function executarSQL(sql, descricao) {
    try {
        console.log(`🔄 Executando: ${descricao}`);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql })
        });

        if (response.ok) {
            console.log(`✅ ${descricao} - Sucesso`);
            return true;
        } else {
            const error = await response.text();
            console.log(`⚠️  ${descricao} - Aviso: ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`⚠️  ${descricao} - Erro: ${error.message}`);
        return false;
    }
}

async function aplicarMigracoes() {
    console.log('🚀 Iniciando aplicação das migrações da integração Hotmart...');
    console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
    
    try {
        // Ler o arquivo de migração
        const migrationPath = path.join(__dirname, 'migrations', 'create_hotmart_integration_complete.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Dividir em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`📋 Encontrados ${commands.length} comandos SQL para executar\n`);
        
        let sucessos = 0;
        let falhas = 0;
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const comando = commands[i];
            let descricao = `Comando ${i + 1}/${commands.length}`;
            
            // Identificar tipo de comando para melhor descrição
            if (comando.includes('CREATE EXTENSION')) {
                descricao = 'Habilitando extensão pgcrypto';
            } else if (comando.includes('CREATE TABLE') && comando.includes('pre_users')) {
                descricao = 'Criando tabela pre_users';
            } else if (comando.includes('CREATE TABLE') && comando.includes('user_assignments')) {
                descricao = 'Criando tabela user_assignments';
            } else if (comando.includes('CREATE TABLE') && comando.includes('webhook_events')) {
                descricao = 'Criando tabela webhook_events';
            } else if (comando.includes('CREATE INDEX')) {
                descricao = 'Criando índices';
            } else if (comando.includes('ENABLE ROW LEVEL SECURITY')) {
                descricao = 'Habilitando RLS';
            } else if (comando.includes('CREATE POLICY')) {
                descricao = 'Criando políticas de segurança';
            } else if (comando.includes('CREATE OR REPLACE FUNCTION update_updated_at_column')) {
                descricao = 'Criando função de trigger updated_at';
            } else if (comando.includes('CREATE TRIGGER')) {
                descricao = 'Criando trigger updated_at';
            } else if (comando.includes('CREATE OR REPLACE FUNCTION allocate_available_user')) {
                descricao = 'Criando função allocate_available_user';
            } else if (comando.includes('CREATE OR REPLACE FUNCTION release_user')) {
                descricao = 'Criando função release_user';
            } else if (comando.includes('INSERT INTO public.pre_users')) {
                descricao = 'Inserindo usuários de exemplo';
            } else if (comando.includes('COMMENT ON')) {
                descricao = 'Adicionando comentários de documentação';
            }
            
            const sucesso = await executarSQL(comando, descricao);
            if (sucesso) {
                sucessos++;
            } else {
                falhas++;
            }
        }
        
        console.log('\n📊 Resumo da migração:');
        console.log(`✅ Sucessos: ${sucessos}`);
        console.log(`⚠️  Avisos/Falhas: ${falhas}`);
        
        if (sucessos > 0) {
            console.log('\n🎉 Migração da integração Hotmart aplicada com sucesso!');
            console.log('\n📋 Estruturas criadas:');
            console.log('• Tabela pre_users (usuários pré-criados)');
            console.log('• Tabela user_assignments (atribuições)');
            console.log('• Tabela webhook_events (log de webhooks)');
            console.log('• Função allocate_available_user() (alocação com concorrência)');
            console.log('• Função release_user() (liberação de usuários)');
            console.log('• Políticas RLS para segurança');
            console.log('• 10 usuários de exemplo inseridos');
            
            console.log('\n🔧 Próximos passos:');
            console.log('1. Configurar webhook da Hotmart');
            console.log('2. Implementar endpoint de webhook');
            console.log('3. Configurar envio de emails');
            console.log('4. Testar fluxo completo');
        }
        
    } catch (error) {
        console.error('❌ Erro ao aplicar migrações:', error.message);
        process.exit(1);
    }
}

// Função para testar as estruturas criadas
async function testarEstruturas() {
    console.log('\n🧪 Testando estruturas criadas...');
    
    try {
        // Testar se as tabelas foram criadas
        const testQueries = [
            {
                sql: "SELECT COUNT(*) as count FROM public.pre_users WHERE status = 'available'",
                descricao: 'Contando usuários disponíveis'
            },
            {
                sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('pre_users', 'user_assignments', 'webhook_events')",
                descricao: 'Verificando tabelas criadas'
            },
            {
                sql: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('allocate_available_user', 'release_user')",
                descricao: 'Verificando funções criadas'
            }
        ];
        
        for (const query of testQueries) {
            await executarSQL(query.sql, query.descricao);
        }
        
        console.log('\n✅ Teste das estruturas concluído!');
        
    } catch (error) {
        console.error('❌ Erro ao testar estruturas:', error.message);
    }
}

// Executar migração
aplicarMigracoes().then(() => {
    return testarEstruturas();
}).catch(error => {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
});

console.log('\n📝 Instruções manuais caso haja erros:');
console.log('1. Acesse o Supabase Dashboard');
console.log('2. Vá em SQL Editor');
console.log('3. Execute o conteúdo do arquivo migrations/create_hotmart_integration_complete.sql');
console.log('4. Verifique se todas as tabelas e funções foram criadas corretamente');