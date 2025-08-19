import { supabase } from '../lib/supabase';
import { generateId } from '../utils/generateId';
async function getAuthToken() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('❌ Erro ao obter sessão:', error.message);
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                console.error('❌ Erro ao renovar token:', refreshError.message);
                return null;
            }
            console.log('✅ Token renovado com sucesso');
            return refreshedSession?.access_token || null;
        }
        if (!session?.access_token) {
            console.warn('⚠️ Nenhum token de acesso encontrado');
            return null;
        }
        return session.access_token;
    }
    catch (error) {
        console.error('❌ Erro crítico ao obter token:', error);
        return null;
    }
}
export const imagensService = {
    async listar(userId, clienteId) {
        try {
            let query = supabase
                .from('imagens_clientes')
                .select('*')
                .order('created_at', { ascending: false });
            if (userId) {
                query = query.eq('user_id', userId);
            }
            if (clienteId) {
                query = query.eq('cliente_id', clienteId);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Erro ao carregar imagens:', error);
                throw new Error(`Erro ao carregar imagens: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro na consulta de imagens:', error);
            throw error;
        }
    },
    async criar(dadosImagem) {
        try {
            const novaImagem = {
                ...dadosImagem,
                id: generateId(),
                created_at: new Date().toISOString()
            };
            const { data, error } = await supabase
                .from('imagens_clientes')
                .insert([novaImagem])
                .select()
                .single();
            if (error) {
                console.error('Erro ao criar imagem:', error);
                throw new Error(`Erro ao criar imagem: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('Erro na criação de imagem:', error);
            throw error;
        }
    },
    async atualizar(id, dadosImagem) {
        try {
            const { data, error } = await supabase
                .from('imagens_clientes')
                .update(dadosImagem)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Erro ao atualizar imagem:', error);
                throw new Error(`Erro ao atualizar imagem: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('Erro na atualização de imagem:', error);
            throw error;
        }
    },
    async excluir(id) {
        try {
            const { error } = await supabase
                .from('imagens_clientes')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('Erro ao excluir imagem:', error);
                throw new Error(`Erro ao excluir imagem: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            console.error('Erro na exclusão de imagem:', error);
            throw error;
        }
    },
    async salvarViaAPI(dadosImagem) {
        try {
            const token = await getAuthToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }
            const response = await fetch('/api/save-client-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosImagem)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Falha ao salvar imagem');
            }
            return result.data;
        }
        catch (error) {
            console.error('Erro ao salvar imagem via API:', error);
            throw error instanceof Error ? error : new Error('Erro desconhecido ao salvar imagem');
        }
    }
};
