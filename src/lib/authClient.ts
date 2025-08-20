import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Cliente de autenticação centralizado com refresh automático de tokens
 * Gerencia sessões, renovação de tokens e interceptação de requisições
 */
class AuthClient {
  private static instance: AuthClient;
  private session: Session | null = null;
  private refreshPromise: Promise<Session | null> | null = null;
  private isRefreshing = false;

  private constructor() {
    this.initializeAuthListener();
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
   * Inicializa o listener de mudanças de estado de autenticação
   * Atualiza automaticamente a sessão quando há mudanças
   */
  private initializeAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthClient] Estado de autenticação alterado:', event, session?.user?.email);
      
      this.session = session;
      
      // Armazena tokens no localStorage para persistência
      if (session) {
        console.log(`✅ [AuthClient] Sessão armazenada - Expira em: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user
        }));
      } else {
        console.log('🗑️ [AuthClient] Sessão removida do localStorage');
        localStorage.removeItem('supabase_session');
      }

      // Reset refresh state quando sessão muda
      this.isRefreshing = false;
      this.refreshPromise = null;
    });
  }

  /**
   * Obtém a sessão atual
   */
  public async getCurrentSession(): Promise<Session | null> {
    if (!this.session) {
      const { data: { session } } = await supabase.auth.getSession();
      this.session = session;
    }
    return this.session;
  }

  /**
   * Obtém o usuário atual
   */
  public async getCurrentUser(): Promise<User | null> {
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
      console.log('🔄 Renovando sessão...');
      
      // Timeout para refresh de sessão (3 segundos)
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao renovar sessão')), 3000);
      });

      const { data, error } = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error('❌ Erro ao renovar sessão:', error);
        throw error;
      }

      if (data.session && this.isTokenValid(data.session)) {
        console.log('✅ Sessão renovada com sucesso');
        this.session = data.session;
        return data.session;
      }

      throw new Error('Sessão renovada inválida ou expirada');
    } catch (error) {
      console.error('❌ Falha ao renovar sessão:', error);
      // Limpa sessão inválida
      this.session = null;
      localStorage.removeItem('supabase_session');
      throw error;
    }
  }

  /**
   * Obtém uma sessão válida, renovando se necessário
   */
  public async getValidSession(): Promise<Session | null> {
    const currentSession = await this.getCurrentSession();
    
    if (!currentSession) {
      console.log('No current session found');
      return null;
    }

    // Se token ainda é válido, retorna sessão atual
    if (this.isTokenValid(currentSession)) {
      return currentSession;
    }

    // Se já está renovando, aguarda o resultado
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Refresh already in progress, waiting...');
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
          
          // Se refresh falhar, redireciona para login
          this.redirectToLogin();
          throw new Error('Sessão expirada e renovação falhou');
        }
        
        throw error;
      }
    }, 2); // Máximo 2 tentativas para requisições autenticadas
  }

  /**
   * Faz logout do usuário
   */
  public async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.session = null;
      localStorage.removeItem('supabase_session');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Redireciona para página de login
   */
  private redirectToLogin(): void {
    // Remove dados de sessão
    this.session = null;
    localStorage.removeItem('supabase_session');
    
    // Redireciona para login (ajustar conforme roteamento da aplicação)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Verifica se usuário está autenticado (versão síncrona para uso rápido)
   */
  public isAuthenticated(): boolean {
    return !!(this.session && this.isTokenValid(this.session));
  }

  /**
   * Verifica se usuário está autenticado (versão assíncrona com validação completa)
   */
  public async isAuthenticatedAsync(): Promise<boolean> {
    try {
      const session = await this.getValidSession();
      return !!session;
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