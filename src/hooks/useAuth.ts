import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Variável para controlar log único
let devModeLogged = false

// Variável para controlar se foi feito logout manual
let hasLoggedOut = false

export interface User {
  id: string
  email: string
  nome: string
  tipo: 'profissional' | 'admin'
  is_admin?: boolean
  onboarding_completed?: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Forçar modo produção - sempre usar Supabase
const isDevMode = false;
// Usuário mock para desenvolvimento
const mockUser: User = {
  id: 'dev-user-123',
  email: 'dev@ciliosclick.com',
  nome: 'Usuária Desenvolvimento',
  tipo: 'profissional',
  is_admin: true,
  onboarding_completed: false
}

/**
 * Hook personalizado para gerenciar autenticação com Supabase
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    let isMounted = true
    
    // Se estiver em modo desenvolvimento, usar mock
    if (isDevMode) {
      // Verificar se foi feito logout manual
      const logoutFlag = localStorage.getItem('ciliosclick_logout')
      
      if (hasLoggedOut || logoutFlag === 'true') {
        console.log('🚪 Modo desenvolvimento: usuário fez logout, mantendo deslogado')
        if (isMounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
        return
      }

      // Log apenas uma vez
      if (!devModeLogged) {
        console.log('🔧 Modo desenvolvimento: usando usuário mock')
        devModeLogged = true
      }
      if (isMounted) {
        setAuthState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true
        })
      }
      return
    }

    // Verificar sessão atual (modo produção)
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
          return
        }

        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Erro na verificação de sessão:', error)
        if (isMounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []) // Array de dependências vazio - executa apenas uma vez

  // Cache para evitar recarregamentos desnecessários
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({})
  
  const loadUserProfile = async (authUser: SupabaseUser) => {
    // Verificar cache primeiro
    if (userCache[authUser.id]) {
      console.log('📋 Usando perfil do cache')
      setAuthState({
        user: userCache[authUser.id],
        isLoading: false,
        isAuthenticated: true
      })
      return
    }
    
    try {
      console.log('🔍 Carregando perfil do usuário:', authUser.email)
      
      // Tentar carregar da tabela users, mas não falhar se não conseguir
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      let user: User

      if (error || !userData) {
        console.log('📝 Criando perfil baseado nos dados do Auth (tabela users não disponível)')
        
        // Criar usuário baseado nos dados do Auth
        user = {
          id: authUser.id,
          email: authUser.email || '',
          nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
          tipo: 'profissional',
          is_admin: false,
          onboarding_completed: false
        }
      } else {
        console.log('✅ Perfil carregado da tabela users')
        
        // Usar dados da tabela users
        user = {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          tipo: userData.is_admin ? 'admin' : 'profissional',
          is_admin: userData.is_admin,
          onboarding_completed: userData.onboarding_completed
        }
      }

      // Salvar no cache
      setUserCache(prev => ({ ...prev, [authUser.id]: user }))
      
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.log('⚠️ Erro ao acessar tabela users, usando dados do Auth:', error)
      
      // Em caso de erro, sempre criar usuário baseado no Auth
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
        tipo: 'profissional',
        is_admin: false,
        onboarding_completed: false
      }

      // Salvar no cache mesmo em caso de erro
      setUserCache(prev => ({ ...prev, [authUser.id]: user }))

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Modo desenvolvimento - simular login
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando login')
      
      // Limpar flags de logout
      hasLoggedOut = false
      localStorage.removeItem('ciliosclick_logout')
      
      setAuthState({
        user: { ...mockUser, email },
        isLoading: false,
        isAuthenticated: true
      })
      return { success: true }
    }

    try {
      console.log('🔐 Iniciando login para:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Erro no signInWithPassword:', error.message)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('✅ SignIn bem-sucedido, carregando perfil...')
        
        try {
          await loadUserProfile(data.user)
          console.log('✅ Perfil carregado, login completo!')
          return { success: true }
        } catch (profileError) {
          console.error('❌ Erro ao carregar perfil:', profileError)
          // Mesmo com erro no perfil, considerar login bem-sucedido
          return { success: true }
        }
      }

      return { success: false, error: 'Erro desconhecido no login' }
    } catch (error) {
      console.error('❌ Erro geral no login:', error)
      return { success: false, error: 'Erro interno no servidor' }
    }
  }

  const register = async (email: string, password: string, nome: string): Promise<{ success: boolean; error?: string }> => {
    // Modo desenvolvimento - simular registro
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando registro')
      setAuthState({
        user: { ...mockUser, email, nome },
        isLoading: false,
        isAuthenticated: true
      })
      return { success: true }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Usuário criado com sucesso no Auth
        // O perfil será criado automaticamente quando fizer login
        console.log('✅ Usuário criado no Supabase Auth:', data.user.id)
        return { success: true }
      }

      return { success: false, error: 'Erro desconhecido no registro' }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro interno no servidor' }
    }
  }

  const logout = async (): Promise<void> => {
    console.log('🚪 Iniciando logout...')
    
    // Limpar cache
    setUserCache({})
    
    // Modo desenvolvimento - simular logout
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando logout')
      
      // Definir flags de logout
      hasLoggedOut = true
      localStorage.setItem('ciliosclick_logout', 'true')
      
      // Limpar localStorage
      localStorage.removeItem('ciliosclick_user')
      localStorage.removeItem('ciliosclick_session')
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
      
      console.log('✅ Logout completo - estado limpo')
      return
    }

    try {
      await supabase.auth.signOut()
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar estado local
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Modo desenvolvimento - simular reset
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando reset de senha')
      return { success: true }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      return { success: false, error: 'Erro interno no servidor' }
    }
  }

  return {
    ...authState,
    login,
    register,
    logout,
    resetPassword
  }
}