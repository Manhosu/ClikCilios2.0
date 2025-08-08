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

// Verificar se está em modo desenvolvimento baseado nas variáveis de ambiente
const isDevMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
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
    // Se estiver em modo desenvolvimento, usar mock
    if (isDevMode) {
      // Verificar se foi feito logout manual
      const logoutFlag = localStorage.getItem('ciliosclick_logout')
      
      if (hasLoggedOut || logoutFlag === 'true') {
        console.log('🚪 Modo desenvolvimento: usuário fez logout, mantendo deslogado')
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        return
      }

      // Log apenas uma vez
      if (!devModeLogged) {
        console.log('🔧 Modo desenvolvimento: usando usuário mock')
        devModeLogged = true
      }
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true
      })
      return
    }

    // Verificar sessão atual (modo produção)
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
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
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        return
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        tipo: userData.is_admin ? 'admin' : 'profissional',
        is_admin: userData.is_admin,
        onboarding_completed: userData.onboarding_completed
      }

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        await loadUserProfile(data.user)
        return { success: true }
      }

      return { success: false, error: 'Erro desconhecido no login' }
    } catch (error) {
      console.error('Erro no login:', error)
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
        // O usuário será criado automaticamente na tabela users via trigger
        return { success: true }
      }

      return { success: false, error: 'Erro desconhecido no registro' }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro interno no servidor' }
    }
  }

  const logout = async (): Promise<void> => {
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