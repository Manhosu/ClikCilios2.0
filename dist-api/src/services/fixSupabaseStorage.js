import { supabase } from '../lib/supabase';
export async function verificarECorrigirStorage() {
    try {
        console.log('🔍 Verificando configuração do Supabase Storage...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.error('❌ Erro ao listar buckets:', bucketsError.message);
            return false;
        }
        const mcpBucket = buckets?.find(b => b.name === 'mcp');
        if (!mcpBucket) {
            console.log('⚠️ Bucket MCP não encontrado, tentando criar...');
            const { error: createError } = await supabase.storage.createBucket('mcp', {
                public: false,
                fileSizeLimit: 10485760,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
            });
            if (createError) {
                console.error('❌ Erro ao criar bucket MCP:', createError.message);
                return false;
            }
            console.log('✅ Bucket MCP criado com sucesso!');
        }
        else {
            console.log('✅ Bucket MCP já existe');
        }
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao verificar storage:', error);
        return false;
    }
}
export async function verificarECorrigirConfiguracoes(userId) {
    try {
        console.log('🔍 Verificando configurações do usuário...');
        const { data: config, error: configError } = await supabase
            .from('configuracoes_usuario')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (configError && configError.code === 'PGRST116') {
            console.log('⚠️ Configurações não encontradas, criando padrão...');
            const { error: insertError } = await supabase
                .from('configuracoes_usuario')
                .insert({
                user_id: userId,
                backup_automatico: true,
                notificacoes_email: true,
                notificacoes_push: true,
                tema: 'claro',
                idioma: 'pt-BR',
                timezone: 'America/Sao_Paulo',
                formato_data: 'DD/MM/YYYY',
                formato_hora: '24h',
                moeda: 'BRL',
                backup_frequencia: 'semanal'
            });
            if (insertError) {
                console.error('❌ Erro ao criar configurações:', insertError.message);
                return false;
            }
            console.log('✅ Configurações criadas com sucesso!');
        }
        else if (config) {
            if (config.backup_automatico === undefined) {
                console.log('⚠️ Coluna backup_automatico não encontrada, atualizando...');
                const { error: updateError } = await supabase
                    .from('configuracoes_usuario')
                    .update({ backup_automatico: true })
                    .eq('user_id', userId);
                if (updateError) {
                    console.error('❌ Erro ao atualizar backup_automatico:', updateError.message);
                    return false;
                }
                console.log('✅ Coluna backup_automatico atualizada!');
            }
            else {
                console.log('✅ Configurações já existem e estão corretas');
            }
        }
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao verificar configurações:', error);
        return false;
    }
}
