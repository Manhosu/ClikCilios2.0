import { supabase } from '../lib/supabase';
class HotmartUsersService {
    async getEstatisticas() {
        try {
            const { data, error } = await supabase
                .rpc('get_users_hotmart_stats');
            if (error) {
                throw error;
            }
            return data || {
                usuarios_disponiveis: 0,
                usuarios_ocupados: 0,
                usuarios_suspensos: 0,
                usuarios_admin: 0,
                total_usuarios: 0,
                total_geral: 0,
                usuarios_com_hotmart: 0
            };
        }
        catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
    async getHotmartUsers(limit = 100, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('is_admin', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao listar usuários Hotmart:', error);
            throw error;
        }
    }
    async getAvailableUsers(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('is_admin', false)
                .eq('status', 'available')
                .is('hotmart_buyer_email', null)
                .order('created_at', { ascending: true })
                .limit(limit);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao listar usuários disponíveis:', error);
            throw error;
        }
    }
    async getOccupiedUsers(limit = 100, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('is_admin', false)
                .eq('status', 'occupied')
                .not('hotmart_buyer_email', 'is', null)
                .order('assigned_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro ao listar usuários ocupados:', error);
            throw error;
        }
    }
    async assignUser(buyerEmail, buyerName, transactionId, notificationId, passwordHash) {
        try {
            const { data, error } = await supabase
                .rpc('assign_user_hotmart', {
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
            console.error('Erro ao atribuir usuário:', error);
            throw error;
        }
    }
    async releaseUser(transactionId, notificationId) {
        try {
            const { data, error } = await supabase
                .rpc('release_user_hotmart', {
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
    async criarUsuariosHotmart(quantidade, prefixo = 'user') {
        try {
            const { data: lastUser, error: lastError } = await supabase
                .from('users')
                .select('username')
                .like('username', `${prefixo}%`)
                .eq('is_admin', false)
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
                const password = this.generateRandomPassword();
                users.push({
                    username,
                    email,
                    nome: `Usuário ${numero}`,
                    status: 'available',
                    is_admin: false,
                    onboarding_completed: false,
                    metadata: {
                        original_password: password,
                        created_for: 'hotmart',
                        created_at: new Date().toISOString()
                    }
                });
            }
            const batchSize = 50;
            const batches = [];
            for (let i = 0; i < users.length; i += batchSize) {
                batches.push(users.slice(i, i + batchSize));
            }
            let totalSucesso = 0;
            let totalErro = 0;
            const usuariosCriados = [];
            for (const batch of batches) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .insert(batch)
                        .select();
                    if (error) {
                        console.error('Erro no lote:', error);
                        totalErro += batch.length;
                    }
                    else {
                        totalSucesso += data.length;
                        usuariosCriados.push(...data);
                    }
                }
                catch (batchError) {
                    console.error('Erro no lote:', batchError);
                    totalErro += batch.length;
                }
            }
            return {
                sucesso: totalSucesso,
                erro: totalErro,
                usuarios: usuariosCriados
            };
        }
        catch (error) {
            console.error('Erro ao criar usuários:', error);
            throw error;
        }
    }
    async suspendUser(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                status: 'suspended',
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .eq('is_admin', false);
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao suspender usuário:', error);
            throw error;
        }
    }
    async reactivateUser(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                status: 'available',
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .eq('is_admin', false)
                .is('hotmart_buyer_email', null);
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao reativar usuário:', error);
            throw error;
        }
    }
    async getUserByTransaction(transactionId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('hotmart_transaction_id', transactionId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }
            return data;
        }
        catch (error) {
            console.error('Erro ao buscar usuário por transação:', error);
            throw error;
        }
    }
    async getUserByNotification(notificationId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('hotmart_notification_id', notificationId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }
            return data;
        }
        catch (error) {
            console.error('Erro ao buscar usuário por notificação:', error);
            throw error;
        }
    }
    generateRandomPassword(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }
        return password;
    }
    async checkAvailableUsersCount() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id', { count: 'exact' })
                .eq('is_admin', false)
                .eq('status', 'available')
                .is('hotmart_buyer_email', null);
            if (error) {
                throw error;
            }
            return data?.length || 0;
        }
        catch (error) {
            console.error('Erro ao verificar usuários disponíveis:', error);
            throw error;
        }
    }
    async clearTestData() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Operação não permitida em produção');
        }
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('is_admin', false)
                .like('email', '%@ciliosclick.com');
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao limpar dados de teste:', error);
            throw error;
        }
    }
}
export const hotmartUsersService = new HotmartUsersService();
export default hotmartUsersService;
