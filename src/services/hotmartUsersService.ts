import { supabase } from '../lib/supabase';

// Interfaces atualizadas para o sistema consolidado
export interface HotmartUser {
  id: string;
  username: string;
  email: string;
  nome: string;
  password_hash?: string;
  status: 'available' | 'occupied' | 'suspended';
  is_admin: boolean;
  onboarding_completed: boolean;
  hotmart_buyer_email?: string;
  hotmart_buyer_name?: string;
  hotmart_transaction_id?: string;
  hotmart_notification_id?: string;
  assigned_at?: string;
  expires_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface HotmartEstatisticas {
  usuarios_disponiveis: number;
  usuarios_ocupados: number;
  usuarios_suspensos: number;
  usuarios_admin: number;
  total_usuarios: number;
  total_geral: number;
  ultima_atribuicao?: string;
  usuarios_com_hotmart: number;
}

export interface AssignUserResult {
  user_id: string;
  username: string;
  success: boolean;
  message: string;
}

export interface ReleaseUserResult {
  user_id: string;
  username: string;
  success: boolean;
  message: string;
}

class HotmartUsersService {
  /**
   * Obter estatísticas dos usuários Hotmart
   */
  async getEstatisticas(): Promise<HotmartEstatisticas> {
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
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Listar usuários Hotmart (não-admin)
   */
  async getHotmartUsers(limit: number = 100, offset: number = 0): Promise<HotmartUser[]> {
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
    } catch (error) {
      console.error('Erro ao listar usuários Hotmart:', error);
      throw error;
    }
  }

  /**
   * Listar usuários disponíveis
   */
  async getAvailableUsers(limit: number = 50): Promise<HotmartUser[]> {
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
    } catch (error) {
      console.error('Erro ao listar usuários disponíveis:', error);
      throw error;
    }
  }

  /**
   * Listar usuários ocupados (com atribuições Hotmart)
   */
  async getOccupiedUsers(limit: number = 100, offset: number = 0): Promise<HotmartUser[]> {
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
    } catch (error) {
      console.error('Erro ao listar usuários ocupados:', error);
      throw error;
    }
  }

  /**
   * Atribuir usuário para comprador Hotmart
   */
  async assignUser(
    buyerEmail: string,
    buyerName: string,
    transactionId: string,
    notificationId: string,
    passwordHash: string
  ): Promise<AssignUserResult | null> {
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
    } catch (error) {
      console.error('Erro ao atribuir usuário:', error);
      throw error;
    }
  }

  /**
   * Liberar usuário (cancelamento/reembolso)
   */
  async releaseUser(
    transactionId: string,
    notificationId: string
  ): Promise<ReleaseUserResult | null> {
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
    } catch (error) {
      console.error('Erro ao liberar usuário:', error);
      throw error;
    }
  }

  /**
   * Criar usuários em lote para Hotmart
   */
  async criarUsuariosHotmart(
    quantidade: number,
    prefixo: string = 'user'
  ): Promise<{ sucesso: number; erro: number; usuarios: HotmartUser[] }> {
    try {
      // Buscar o último número usado
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

      // Determinar o próximo número
      let nextNumber = 1;
      if (lastUser && lastUser.length > 0) {
        const lastUsername = lastUser[0].username;
        const match = lastUsername.match(new RegExp(`${prefixo}(\\d+)`));
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Gerar os usuários
      const users: Partial<HotmartUser>[] = [];
      for (let i = 0; i < quantidade; i++) {
        const numero = (nextNumber + i).toString().padStart(4, '0');
        const username = `${prefixo}${numero}`;
        const email = `${username}@ciliosclick.com`;
        
        // Gerar senha aleatória
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

      // Inserir em lotes de 50
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }

      let totalSucesso = 0;
      let totalErro = 0;
      const usuariosCriados: HotmartUser[] = [];

      for (const batch of batches) {
        try {
          const { data, error } = await supabase
            .from('users')
            .insert(batch)
            .select();

          if (error) {
            console.error('Erro no lote:', error);
            totalErro += batch.length;
          } else {
            totalSucesso += data.length;
            usuariosCriados.push(...data);
          }
        } catch (batchError) {
          console.error('Erro no lote:', batchError);
          totalErro += batch.length;
        }
      }

      return {
        sucesso: totalSucesso,
        erro: totalErro,
        usuarios: usuariosCriados
      };
    } catch (error) {
      console.error('Erro ao criar usuários:', error);
      throw error;
    }
  }

  /**
   * Suspender usuário
   */
  async suspendUser(userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      throw error;
    }
  }

  /**
   * Reativar usuário
   */
  async reactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('is_admin', false)
        .is('hotmart_buyer_email', null); // Só reativar se não estiver atribuído

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por transação Hotmart
   */
  async getUserByTransaction(transactionId: string): Promise<HotmartUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('hotmart_transaction_id', transactionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário por transação:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por notificação Hotmart
   */
  async getUserByNotification(notificationId: string): Promise<HotmartUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('hotmart_notification_id', notificationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário por notificação:', error);
      throw error;
    }
  }

  /**
   * Gerar senha aleatória com letras e números
   */
  private generateRandomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    
    return password;
  }

  /**
   * Verificar se há usuários suficientes disponíveis
   */
  async checkAvailableUsersCount(): Promise<number> {
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
    } catch (error) {
      console.error('Erro ao verificar usuários disponíveis:', error);
      throw error;
    }
  }

  /**
   * Limpar dados de teste (apenas em desenvolvimento)
   */
  async clearTestData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Operação não permitida em produção');
    }

    try {
      // Limpar apenas usuários de teste (não-admin)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('is_admin', false)
        .like('email', '%@ciliosclick.com');

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
      throw error;
    }
  }
}

export const hotmartUsersService = new HotmartUsersService();
export default hotmartUsersService;