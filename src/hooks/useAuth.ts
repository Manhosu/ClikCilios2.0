import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Variável para controlar log único
let devModeLogged = false

// Variável para controlar se foi feito logout manual
let hasLoggedOut = false

// Variável para evitar múltiplas verificações simultâneas
let isCheckingAuth = false

// Cache global para sessão
let sessionCache: { user: User | null; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

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

  const isMountedRef = useRef(true)
  
  // Função para verificar cache
  const checkCache = useCallback(() => {
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
      console.log('📋 Usando cache de sessão válido')
      setAuthState({
        user: sessionCache.user,
        isLoading: false,
        isAuthenticated: !!sessionCache.user
      })
      return true
    }
    return false
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    
    // Verificar cache primeiro
    if (checkCache()) {
      return
    }
    
    // Timeout de segurança reduzido para melhor UX
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('⏰ Timeout de autenticação atingido, definindo como não autenticado')
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        // Limpar cache em caso de timeout
        sessionCache = null
      }
    }, 5000) // Reduzido para 5 segundos
    
    // Se estiver em modo desenvolvimento, usar mock
    if (isDevMode) {
      clearTimeout(timeoutId)
      
      // Verificar se foi feito logout manual
      const logoutFlag = localStorage.getItem('ciliosclick_logout')
      
      if (hasLoggedOut || logoutFlag === 'true') {
        console.log('🚪 Modo desenvolvimento: usuário fez logout, mantendo deslogado')
        if (isMountedRef.current) {
          const newState = {
            user: null,
            isLoading: false,
            isAuthenticated: false
          }
          setAuthState(newState)
          // Atualizar cache
          sessionCache = { user: null, timestamp: Date.now() }
        }
        return
      }

      // Log apenas uma vez
      if (!devModeLogged) {
        console.log('🔧 Modo desenvolvimento: usando usuário mock')
        devModeLogged = true
      }
      if (isMountedRef.current) {
        const newState = {
          user: mockUser,
          isLoading: false,
          isAuthenticated: true
        }
        setAuthState(newState)
        // Atualizar cache
        sessionCache = { user: mockUser, timestamp: Date.now() }
      }
      return
    }

    // Verificar sessão atual (modo produção)
    const getSession = async () => {
      // Evitar múltiplas verificações simultâneas
      if (isCheckingAuth) {
        console.log('⏳ Verificação de autenticação já em andamento, ignorando...')
        return
      }
      
      isCheckingAuth = true
      
      try {
        console.log('🔍 Verificando sessão inicial...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMountedRef.current) {
          isCheckingAuth = false
          return
        }
        
        // Limpar timeout pois a verificação foi concluída
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error)
          const newState = {
            user: null,
            isLoading: false,
            isAuthenticated: false
          }
          setAuthState(newState)
          // Atualizar cache
          sessionCache = { user: null, timestamp: Date.now() }
          isCheckingAuth = false
          return
        }

        if (session?.user) {
          console.log('✅ Sessão encontrada, carregando perfil...')
          await loadUserProfile(session.user, timeoutId)
        } else {
          console.log('ℹ️ Nenhuma sessão ativa, redirecionando para login')
          const newState = {
            user: null,
            isLoading: false,
            isAuthenticated: false
          }
          setAuthState(newState)
          // Atualizar cache
          sessionCache = { user: null, timestamp: Date.now() }
        }
        
        isCheckingAuth = false
      } catch (error) {
        console.error('❌ Erro na verificação de sessão:', error)
        clearTimeout(timeoutId)
        isCheckingAuth = false
        if (isMountedRef.current) {
          const newState = {
            user: null,
            isLoading: false,
            isAuthenticated: false
          }
          setAuthState(newState)
          // Atualizar cache
          sessionCache = { user: null, timestamp: Date.now() }
        }
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return
        
        console.log('🔄 Auth state change:', event)
        
        // Ignorar eventos INITIAL_SESSION para evitar loops
        if (event === 'INITIAL_SESSION') {
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          const newState = {
            user: null,
            isLoading: false,
            isAuthenticated: false
          }
          setAuthState(newState)
          // Limpar cache no logout
          sessionCache = { user: null, timestamp: Date.now() }
        }
      }
    )

    return () => {
      isMountedRef.current = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      isCheckingAuth = false
    }
  }, [checkCache]) // Incluir checkCache nas dependências

  // Cache para evitar recarregamentos desnecessários
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({})
  
  const loadUserProfile = useCallback(async (authUser: SupabaseUser, timeoutId?: NodeJS.Timeout) => {
    // Verificar cache primeiro
    if (userCache[authUser.id]) {
      console.log('📋 Usando perfil do cache')
      if (timeoutId) clearTimeout(timeoutId)
      const newState = {
        user: userCache[authUser.id],
        isLoading: false,
        isAuthenticated: true
      }
      setAuthState(newState)
      // Atualizar cache global
      sessionCache = { user: userCache[authUser.id], timestamp: Date.now() }
      return
    }
    
    try {
      console.log('🔍 Carregando perfil do usuário:', authUser.email)
      if (timeoutId) clearTimeout(timeoutId)
      
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
      
      const newState = {
        user,
        isLoading: false,
        isAuthenticated: true
      }
      setAuthState(newState)
      // Atualizar cache global
      sessionCache = { user, timestamp: Date.now() }
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

      const newState = {
        user,
        isLoading: false,
        isAuthenticated: true
      }
      setAuthState(newState)
      // Atualizar cache global
      sessionCache = { user, timestamp: Date.now() }
    }
  }, [userCache])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Modo desenvolvimento - simular login
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando login')
      
      // Limpar flags de logout
      hasLoggedOut = false
      localStorage.removeItem('ciliosclick_logout')
      
      const user = { ...mockUser, email }
      const newState = {
        user,
        isLoading: false,
        isAuthenticated: true
      }
      setAuthState(newState)
      // Atualizar cache
      sessionCache = { user, timestamp: Date.now() }
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
  }, [loadUserProfile])

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

  const logout = useCallback(async (): Promise<void> => {
    console.log('🚪 Iniciando logout...')
    
    // Limpar todos os caches
    setUserCache({})
    sessionCache = null
    
    // Modo desenvolvimento - simular logout
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando logout')
      
      // Definir flags de logout
      hasLoggedOut = true
      localStorage.setItem('ciliosclick_logout', 'true')
      
      // Limpar localStorage
      localStorage.removeItem('ciliosclick_user')
      localStorage.removeItem('ciliosclick_session')
      
      const newState = {
        user: null,
        isLoading: false,
        isAuthenticated: false
      }
      setAuthState(newState)
      
      console.log('✅ Logout completo - estado limpo')
      return
    }

    try {
      await supabase.auth.signOut()
      const newState = {
        user: null,
        isLoading: false,
        isAuthenticated: false
      }
      setAuthState(newState)
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar estado local
      const newState = {
        user: null,
        isLoading: false,
        isAuthenticated: false
      }
      setAuthState(newState)
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Modo desenvolvimento - simular reset
    if (isDevMode) {
      console.log('🔧 Modo desenvolvimento: simulando reset de senha para', email)
      return { success: true }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('Erro no reset de senha:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Erro geral no reset de senha:', error)
      return { success: false, error: 'Erro interno no servidor' }
    }
  }, [])

  return {
    ...authState,
    login,
    register,
    logout,
    resetPassword
  }
}