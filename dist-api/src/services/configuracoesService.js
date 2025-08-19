import { supabase } from '../lib/supabase';
const configuracoesDefault = {
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
export const configuracoesService = {
    async obter(userId) {
        const { data, error } = await supabase
            .from('configuracoes_usuario')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao carregar configurações: ${error.message}`);
        }
        if (!data) {
            return await this.criar(userId);
        }
        return data;
    },
    async criar(userId) {
        const novasConfiguracoes = {
            ...configuracoesDefault,
            user_id: userId
        };
        const { data, error } = await supabase
            .from('configuracoes_usuario')
            .insert(novasConfiguracoes)
            .select()
            .single();
        if (error) {
            throw new Error(`Erro ao criar configurações: ${error.message}`);
        }
        return data;
    },
    async atualizar(userId, configuracoes) {
        const { data, error } = await supabase
            .from('configuracoes_usuario')
            .update({
            ...configuracoes,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            throw new Error(`Erro ao atualizar configurações: ${error.message}`);
        }
        return data;
    }
};
