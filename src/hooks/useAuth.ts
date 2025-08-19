import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { verificarECorrigirStorage } from '../services/fixSupabaseStorage'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
 * Versão otimizada sem complexidade desnecessária
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Função para carregar perfil do usuário
  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      console.log('🔍 Carregando perfil do usuário:', authUser.email)
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, nome, is_admin, onboarding_completed')
        .eq('id', authUser.id)
        .single()

      let user: User

      if (error || !userData) {
        console.log('📝 Usando dados do Auth como fallback')
        user = {
          id: authUser.id,
          email: authUser.email || '',
          nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
          tipo: 'profissional',
          is_admin: false,
          onboarding_completed: false
        }
      } else {
        console.log('✅ Perfil carregado do banco:', userData.nome)
        user = {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          tipo: userData.is_admin ? 'admin' : 'profissional',
          is_admin: userData.is_admin,
          onboarding_completed: userData.onboarding_completed
        }
      }

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })
      
      // Verificar e corrigir configuração do Supabase Storage em background
      verificarECorrigirStorage()
        .then(() => console.log('✅ Storage verificado e configurado'))
        .catch(error => console.error('❌ Erro ao verificar storage:', error))
        
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error)
      
      // Fallback de emergência
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
        tipo: 'profissional',
        is_admin: false,
        onboarding_completed: false
      }

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })
      
      // Verificar e corrigir configuração do Supabase Storage em background
      verificarECorrigirStorage()
        .then(() => console.log('✅ Storage verificado e configurado (fallback)'))
        .catch(error => console.error('❌ Erro ao verificar storage (fallback):', error))
    }
  }, [])

  // Inicialização da autenticação
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error)
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
          return
        }
        
        if (session?.user) {
          console.log('✅ Sessão encontrada para:', session.user.email)
          await loadUserProfile(session.user)
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
        if (mounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    }

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📡 Evento de autenticação:', event)
      
      if (!mounted) return
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Usuário logado:', session.user.email)
        await loadUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuário deslogado')
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token renovado com sucesso')
        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Recuperação de senha iniciada')
      } else {
        console.log('ℹ️ Evento de autenticação não tratado:', event)
      }
    })

    // Inicializar
    initializeAuth()

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

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
        // O listener vai cuidar de carregar o perfil
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