import { createClient } from '@supabase/supabase-js';
export default async function handler(req, res) {
    console.log('🔍 WEBHOOK TESTE - Iniciado');
    if (req.method !== 'POST') {
        console.log('❌ Método não permitido:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        console.log('✅ Teste 1: Webhook iniciado com sucesso');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl) {
            throw new Error('SUPABASE_URL não configurada. Configure NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL no Vercel.');
        }
        if (!serviceKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel.');
        }
        const hotmartToken = process.env.HOTMART_HOTTOK;
        console.log('🔍 Teste 2: Verificando variáveis...');
        console.log('- SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ FALTANDO');
        console.log('- SERVICE_KEY:', serviceKey ? '✅ OK' : '❌ FALTANDO');
        console.log('- HOTMART_TOKEN:', hotmartToken ? '✅ OK' : '❌ FALTANDO');
        if (!supabaseUrl || !serviceKey) {
            console.log('❌ Variáveis de ambiente faltando');
            return res.status(500).json({
                error: 'Missing environment variables',
                details: {
                    supabaseUrl: !!supabaseUrl,
                    serviceKey: !!serviceKey,
                    hotmartToken: !!hotmartToken
                }
            });
        }
        if (hotmartToken) {
            const receivedToken = req.headers['x-hotmart-hottok'];
            if (receivedToken !== hotmartToken) {
                console.log('❌ Token Hotmart inválido');
                return res.status(401).json({ error: 'Invalid Hotmart token' });
            }
            console.log('✅ Teste 3: Token Hotmart válido');
        }
        else {
            console.log('⚠️ Teste 3: Token Hotmart não configurado - pulando validação');
        }
        console.log('🔍 Teste 4: Testando conexão Supabase...');
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        if (testError) {
            console.log('❌ Erro de conexão Supabase:', testError.message);
            return res.status(500).json({
                error: 'Supabase connection failed',
                details: testError.message
            });
        }
        console.log('✅ Teste 4: Conexão Supabase OK');
        console.log('🔍 Teste 5: Verificando tabela webhook_events...');
        const testPayload = {
            source: 'teste',
            event_type: 'TESTE_DIAGNOSTICO',
            payload: {
                teste: true,
                timestamp: new Date().toISOString(),
                headers: req.headers
            },
            received_at: new Date().toISOString()
        };
        const { error: insertError } = await supabase
            .from('webhook_events')
            .insert(testPayload);
        if (insertError) {
            console.log('❌ Erro ao inserir webhook_events:', insertError.message);
            if (insertError.message.includes('relation "webhook_events" does not exist')) {
                return res.status(500).json({
                    error: 'Table webhook_events does not exist',
                    solution: 'Execute criar-webhook-events-limpo.sql no Supabase'
                });
            }
            return res.status(500).json({
                error: 'Failed to insert webhook_events',
                details: insertError.message
            });
        }
        console.log('✅ Teste 5: Tabela webhook_events OK');
        console.log('🔍 Teste 6: Verificando outras tabelas...');
        const tabelasEssenciais = ['users', 'pre_users', 'hotmart_users'];
        const tabelasStatus = {};
        for (const tabela of tabelasEssenciais) {
            const { error } = await supabase
                .from(tabela)
                .select('count')
                .limit(1);
            if (error) {
                console.log(`❌ Tabela ${tabela}: ${error.message}`);
                tabelasStatus[tabela] = false;
            }
            else {
                console.log(`✅ Tabela ${tabela}: OK`);
                tabelasStatus[tabela] = true;
            }
        }
        console.log('🔍 Teste 7: Simulando processamento...');
        const payload = req.body || {
            event: 'PURCHASE_APPROVED',
            data: {
                buyer: { email: 'teste@exemplo.com', name: 'Teste' },
                purchase: { transaction: 'TXN-TESTE' }
            }
        };
        console.log('Payload recebido:', JSON.stringify(payload, null, 2));
        await supabase
            .from('webhook_events')
            .delete()
            .eq('event_type', 'TESTE_DIAGNOSTICO');
        console.log('✅ Todos os testes passaram!');
        return res.status(200).json({
            message: 'Webhook teste executado com sucesso',
            tests: {
                webhook_started: true,
                environment_vars: true,
                supabase_connection: true,
                webhook_events_table: true,
                other_tables: tabelasStatus,
                payload_received: true
            },
            payload: payload,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Erro geral no webhook teste:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}
