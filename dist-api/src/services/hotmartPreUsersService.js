import { supabase } from '../lib/supabase';
class HotmartPreUsersService {
    async getEstatisticas() {
        try {
            const { data, error } = await supabase
                .rpc('get_pre_users_stats');
            if (error) {
                throw error;
            }
            if (!data || data.length === 0) {
                return {
                    usuarios_disponiveis: 0,
                    usuarios_ocupados: 0,
                    usuarios_suspensos: 0,
                    total_usuarios: 0,
                    total_atribuicoes: 0,
                    atribuicoes_ativas: 0,
                    atribuicoes_canceladas: 0
                };
            }
            const stats = data[0];
            return {
                usuarios_disponiveis: Number(stats.usuarios_disponiveis) || 0,
                usuarios_ocupados: Number(stats.usuarios_ocupados) || 0,
                usuarios_suspensos: Number(stats.usuarios_suspensos) || 0,
                total_usuarios: Number(stats.total_usuarios) || 0,
                total_atribuicoes: Number(stats.total_atribuicoes) || 0,
                atribuicoes_ativas: Number(stats.atribuicoes_ativas) || 0,
                atribuicoes_canceladas: Number(stats.atribuicoes_canceladas) || 0
            };
        }
        catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
    async getPreUsers(limit = 100, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('pre_users')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao listar usuários pré-criados:', error);
            throw error;
        }
    }
    async getUserAssignments(limit = 100, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('user_assignments')
                .select(`
          *,
          pre_user:pre_users(
            id,
            username,
            email,
            status
          )
        `)
                .order('assigned_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao listar atribuições:', error);
            throw error;
        }
    }
    async assignPreUser(buyerEmail, buyerName, transactionId, notificationId, passwordHash) {
        try {
            const { data, error } = await supabase
                .rpc('assign_pre_user', {
                p_buyer_email: buyerEmail,
                p_buyer_name: buyerName,
                p_hotmart_transaction_id: transactionId,
                p_hotmart_notification_id: notificationId,
                p_password_hash: passwordHash
            });
            if (error) {
                throw error;
            }
            if (!data || data.length === 0) {
                return null;
            }
            return data[0];
        }
        catch (error) {
            console.error('Erro ao alocar usuário:', error);
            throw error;
        }
    }
    async releasePreUser(buyerEmail, transactionId, notificationId) {
        try {
            const { data, error } = await supabase
                .rpc('release_pre_user', {
                p_buyer_email: buyerEmail,
                p_hotmart_transaction_id: transactionId,
                p_hotmart_notification_id: notificationId
            });
            if (error) {
                throw error;
            }
            if (!data || data.length === 0) {
                return null;
            }
            return data[0];
        }
        catch (error) {
            console.error('Erro ao liberar usuário:', error);
            throw error;
        }
    }
    async criarUsuariosPreCriados(quantidade, prefixo = 'user') {
        try {
            const { data: lastUser, error: lastError } = await supabase
                .from('pre_users')
                .select('username')
                .like('username', `${prefixo}%`)
                .order('username', { ascending: false })
                .limit(1);
            if (lastError && lastError.code !== 'PGRST116') {
                throw lastError;
            }
            let nextNumber = 1;
            if (lastUser && lastUser.length > 0) {
                const lastUsername = lastUser[0].username;
                const match = lastUsername.match(new RegExp(`${prefixo}(\\d+)`));
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            const users = [];
            for (let i = 0; i < quantidade; i++) {
                const numero = (nextNumber + i).toString().padStart(4, '0');
                const username = `${prefixo}${numero}`;
                const email = `${username}@ciliosclick.com`;
                users.push({
                    username,
                    email,
                    status: 'available',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            const batchSize = 50;
            const usuariosCriados = [];
            let sucesso = 0;
            let erro = 0;
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                try {
                    const { data, error } = await supabase
                        .from('pre_users')
                        .insert(batch)
                        .select();
                    if (error) {
                        throw error;
                    }
                    if (data) {
                        usuariosCriados.push(...data);
                        sucesso += data.length;
                    }
                }
                catch (batchError) {
                    console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, batchError);
                    erro += batch.length;
                }
            }
            return {
                sucesso,
                erro,
                usuarios: usuariosCriados
            };
        }
        catch (error) {
            console.error('Erro ao criar usuários pré-criados:', error);
            throw error;
        }
    }
    async suspendPreUser(userId) {
        try {
            const { error } = await supabase
                .from('pre_users')
                .update({
                status: 'suspended',
                updated_at: new Date().toISOString()
            })
                .eq('id', userId);
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao suspender usuário:', error);
            throw error;
        }
    }
    async reactivatePreUser(userId) {
        try {
            const { error } = await supabase
                .from('pre_users')
                .update({
                status: 'available',
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .eq('status', 'suspended');
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao reativar usuário:', error);
            throw error;
        }
    }
}
export const hotmartPreUsersService = new HotmartPreUsersService();
