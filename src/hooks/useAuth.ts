import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface User {
  id: string
  email: string
  nome: string
  tipo: 'admin' | 'profissional'
  is_admin: boolean
  onboarding_completed: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * Hook simplificado para gerenciar autenticação com Supabase
 * Usa apenas persistência nativa do Supabase, sem cache customizado
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })
  
  const initializationRef = useRef(false)
  const mountedRef = useRef(true)

  // Função removida - agora criamos usuário diretamente na inicialização

  // Inicialização simplificada da autenticação
  useEffect(() => {
    // Evitar múltiplas inicializações
    if (initializationRef.current) return
    initializationRef.current = true
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...')
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return
        
        if (session?.user) {
          console.log('✅ Sessão encontrada para:', session.user.email)
          
          // Criar usuário simples sem buscar dados adicionais
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
            tipo: 'profissional',
            is_admin: false,
            onboarding_completed: true
          }
          
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          console.log('ℹ️ Nenhuma sessão ativa')
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
        
      } catch (error) {
        console.error('❌ Erro na inicialização:', error)
        
        if (!mountedRef.current) return
        
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }
    
    // Executar inicialização
    initializeAuth()
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (!mountedRef.current) return
      
      if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      } else if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
          tipo: 'profissional',
          is_admin: false,
          onboarding_completed: true
        }
        
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
      }
    })
    
    // Cleanup
    return () => {
      subscription.unsubscribe()
      mountedRef.current = false
    }
  }, [])

  // Função de login
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Fazendo login para:', email)
      
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ Erro no login:', error.message)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: error.message }
      }
      
      if (data.user) {
        console.log('✅ Login bem-sucedido')
        // Definir isAuthenticated imediatamente para redirecionamento instantâneo
        setAuthState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }))
        // O listener vai cuidar de carregar o perfil completo
        return { success: true }
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Falha na autenticação' }
      
    } catch (error) {
      console.error('❌ Erro crítico no login:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }, [])

  // Função de logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 Fazendo logout...')
      
      await supabase.auth.signOut()
      // O listener vai cuidar de limpar o estado
    } catch (error) {
      console.error('❌ Erro no logout:', error)
    }
  }, [])

  // Função de registro
  const register = useCallback(async (email: string, password: string, nome: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Registrando usuário:', email)
      
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
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
        console.error('❌ Erro no registro:', error.message)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: error.message }
      }
      
      if (data.user) {
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            nome,
            is_admin: false,
            onboarding_completed: false
          })
        
        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError.message)
        }
        
        console.log('✅ Registro bem-sucedido')
        return { success: true }
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Falha no registro' }
      
    } catch (error) {
      console.error('❌ Erro crítico no registro:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }, [])

  // Função de reset de senha
  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔄 Enviando reset de senha para:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        console.error('❌ Erro no reset de senha:', error.message)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Email de reset enviado')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Erro crítico no reset:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }, [])

  return {
    ...authState,
    login,
    logout,
    register,
    resetPassword
  }
}