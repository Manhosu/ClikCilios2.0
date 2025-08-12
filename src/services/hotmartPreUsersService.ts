import { supabase } from '../lib/supabase';

// Interfaces para os tipos de dados
export interface PreUser {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  status: 'available' | 'occupied' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserAssignment {
  id: string;
  pre_user_id: string;
  buyer_email: string;
  buyer_name: string;
  hotmart_transaction_id: string;
  hotmart_notification_id: string;
  event: string;
  assigned_at: string;
  released_at?: string;
  status: 'active' | 'cancelled';
  pre_user?: PreUser;
}

export interface Estatisticas {
  usuarios_disponiveis: number;
  usuarios_ocupados: number;
  usuarios_suspensos: number;
  total_usuarios: number;
  total_atribuicoes: number;
  atribuicoes_ativas: number;
  atribuicoes_canceladas: number;
}

export interface AssignUserResult {
  pre_user_id: string;
  username: string;
}

export interface ReleaseUserResult {
  pre_user_id: string;
  username: string;
  released: boolean;
}

class HotmartPreUsersService {
  /**
   * Obtém estatísticas dos usuários pré-criados
   */
  async getEstatisticas(): Promise<Estatisticas> {
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
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Lista todos os usuários pré-criados
   */
  async getPreUsers(limit: number = 100, offset: number = 0): Promise<PreUser[]> {
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
    } catch (error) {
      console.error('Erro ao listar usuários pré-criados:', error);
      throw error;
    }
  }

  /**
   * Lista todas as atribuições de usuários
   */
  async getUserAssignments(limit: number = 100, offset: number = 0): Promise<UserAssignment[]> {
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
    } catch (error) {
      console.error('Erro ao listar atribuições:', error);
      throw error;
    }
  }

  /**
   * Aloca um usuário pré-criado (usando RPC)
   */
  async assignPreUser(
    buyerEmail: string,
    buyerName: string,
    transactionId: string,
    notificationId: string,
    passwordHash: string
  ): Promise<AssignUserResult | null> {
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
        return null; // Já processado ou sem usuários disponíveis
      }

      return data[0];
    } catch (error) {
      console.error('Erro ao alocar usuário:', error);
      throw error;
    }
  }

  /**
   * Libera um usuário pré-criado (usando RPC)
   */
  async releasePreUser(
    buyerEmail: string,
    transactionId: string,
    notificationId: string
  ): Promise<ReleaseUserResult | null> {
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
        return null; // Já processado ou sem atribuição ativa
      }

      return data[0];
    } catch (error) {
      console.error('Erro ao liberar usuário:', error);
      throw error;
    }
  }

  /**
   * Cria usuários pré-criados em lote
   */
  async criarUsuariosPreCriados(
    quantidade: number,
    prefixo: string = 'user'
  ): Promise<{ sucesso: number; erro: number; usuarios: PreUser[] }> {
    try {
      // Busca o último número usado
      const { data: lastUser, error: lastError } = await supabase
        .from('pre_users')
        .select('username')
        .like('username', `${prefixo}%`)
        .order('username', { ascending: false })
        .limit(1);

      if (lastError && lastError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw lastError;
      }

      // Determina o próximo número
      let nextNumber = 1;
      if (lastUser && lastUser.length > 0) {
        const lastUsername = lastUser[0].username;
        const match = lastUsername.match(new RegExp(`${prefixo}(\\d+)`));
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Gera os usuários
      const users: Omit<PreUser, 'id'>[] = [];
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

      // Insere em lotes de 50
      const batchSize = 50;
      const usuariosCriados: PreUser[] = [];
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
        } catch (batchError) {
          console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, batchError);
          erro += batch.length;
        }
      }

      return {
        sucesso,
        erro,
        usuarios: usuariosCriados
      };
    } catch (error) {
      console.error('Erro ao criar usuários pré-criados:', error);
      throw error;
    }
  }

  /**
   * Suspende um usuário pré-criado
   */
  async suspendPreUser(userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      throw error;
    }
  }

  /**
   * Reativa um usuário suspenso
   */
  async reactivatePreUser(userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
export const hotmartPreUsersService = new HotmartPreUsersService();