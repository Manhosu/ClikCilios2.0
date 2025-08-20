import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Cliente simplificado para requisições autenticadas
 * Não gerencia estado de autenticação - isso fica com o useAuth
 */
class AuthClient {
  private static instance: AuthClient;
  private refreshPromise: Promise<Session | null> | null = null;
  private isRefreshing = false;

  private constructor() {
    // Não precisa mais do listener - useAuth cuida disso
  }

  /**
   * Singleton pattern para garantir uma única instância
   */
  public static getInstance(): AuthClient {
    if (!AuthClient.instance) {
      AuthClient.instance = new AuthClient();
    }
    return AuthClient.instance;
  }

  /**
   * Obtém a sessão atual diretamente do Supabase
   */
  public async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Obtém o usuário atual
   */
  public async getCurrentUser(): Promise<any> {
    const session = await this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Verifica se o token de acesso está válido
   */
  private isTokenValid(session: Session): boolean {
    if (!session.expires_at || !session.access_token) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    // Considera token inválido se expira em menos de 2 minutos (reduzido para ser mais conservador)
    return expiresAt > (now + 120);
  }

  /**
   * Renova a sessão usando o refresh token
   */
  private async refreshSession(): Promise<Session | null> {
    try {
      console.log('🔄 [AuthClient] Renovando sessão...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [AuthClient] Erro ao renovar sessão:', error);
        throw error;
      }

      if (data.session && this.isTokenValid(data.session)) {
        console.log('✅ [AuthClient] Sessão renovada com sucesso');
        return data.session;
      }

      throw new Error('Sessão renovada inválida ou expirada');
    } catch (error) {
      console.error('❌ [AuthClient] Falha ao renovar sessão:', error);
      throw error;
    }
  }

  /**
   * Obtém uma sessão válida, renovando se necessário
   */
  public async getValidSession(): Promise<Session | null> {
    const currentSession = await this.getCurrentSession();
    
    if (!currentSession) {
      return null;
    }

    // Se token ainda é válido, retorna sessão atual
    if (this.isTokenValid(currentSession)) {
      return currentSession;
    }

    // Se já está renovando, aguarda o resultado
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Inicia processo de renovação
    this.isRefreshing = true;
    this.refreshPromise = this.refreshSession();

    try {
      const refreshedSession = await this.refreshPromise;
      this.isRefreshing = false;
      return refreshedSession;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Implementa retry com backoff exponencial
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Não fazer retry para erros de autenticação ou últimas tentativas
        if (attempt === maxRetries || error.status === 401 || error.status === 403) {
          throw error;
        }
        
        // Calcular delay com backoff exponencial
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Interceptador de requisições que garante token válido
   */
  public async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      const session = await this.getValidSession();
      
      if (!session) {
        throw new Error('No valid session available');
      }

      try {
        return await requestFn(session.access_token);
      } catch (error: any) {
        // Se erro 401, tenta renovar sessão uma vez
        if (error.status === 401 || error.message?.includes('401')) {
          console.log('🔄 Erro 401 detectado, tentando renovar sessão...');
          
          const refreshedSession = await this.refreshSession();
          if (refreshedSession) {
            return await requestFn(refreshedSession.access_token);
          }
          
          // Se refresh falhar, lança erro para o useAuth tratar
          throw new Error('Sessão expirada e renovação falhou');
        }
        
        throw error;
      }
    }, 2); // Máximo 2 tentativas para requisições autenticadas
  }

  /**
   * Verifica se usuário está autenticado (versão simples)
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      return !!(session && this.isTokenValid(session));
    } catch {
      return false;
    }
  }

  /**
   * Obtém token de acesso válido
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getValidSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }
}

// Exporta instância singleton
export const authClient = AuthClient.getInstance();
export default authClient;