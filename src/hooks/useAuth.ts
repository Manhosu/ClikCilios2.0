import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { performanceOptimizer } from '../utils/performanceOptimizer'
import { networkOptimizer } from '../utils/networkOptimizer'
import { performanceMonitor } from '../utils/performanceMonitor'

// Sistema de cache ultra-avançado para performance máxima
interface CacheEntry {
  user: User
  timestamp: number
  sessionId: string
}

let globalCache: CacheEntry | null = null
let isInitializing = false
let initializationPromise: Promise<void> | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const FAST_INIT_TIMEOUT = 4000 // 4 segundos para inicialização mais responsiva
const FALLBACK_TIMEOUT = 2000 // 2 segundos para fallback rápido

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

/**
 * Hook personalizado para gerenciar autenticação com Supabase
 * Versão otimizada para evitar carregamento persistente
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  const isMountedRef = useRef(true)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    
    // Verificação ultra-rápida de cache primeiro
    const checkCacheFirst = () => {
      if (globalCache && Date.now() - globalCache.timestamp < CACHE_DURATION) {
        console.log('⚡ Cache hit - carregamento instantâneo')
        setAuthState({
          user: globalCache.user,
          isLoading: false,
          isAuthenticated: true
        })
        return true
      }
      return false
    }
    
    // Se cache válido, usar imediatamente
    if (checkCacheFirst()) {
      return
    }
    
    // Sistema de retry inteligente
    let retryCount = 0
    const MAX_RETRIES = 3
    const RETRY_DELAYS = [500, 1000, 2000] // Backoff exponencial mais rápido
    
    // Timeout de segurança para inicialização
    initTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isInitializing) {
        console.log('⏰ Timeout de inicialização atingido, ativando fallback...', {
          retryCount,
          cacheStatus: globalCache ? 'disponível' : 'indisponível',
          timeout: `${FAST_INIT_TIMEOUT}ms`,
          timestamp: new Date().toISOString()
        })
        
        // Fallback robusto com timeout mais curto
        const fallbackTimeoutId = setTimeout(() => {
          console.log('🚨 Fallback timeout atingido, forçando estado offline')
          
          if (globalCache?.user) {
            console.log('📦 Usando cache em modo offline')
            setAuthState({
              user: globalCache.user,
              isLoading: false,
              isAuthenticated: true
            })
          } else {
            console.log('❌ Modo offline sem cache, redirecionando para login')
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            })
          }
        }, FALLBACK_TIMEOUT)
        
        // Tentar uma última verificação rápida
        supabase.auth.getSession()
          .then(({ data: { session }, error }) => {
            clearTimeout(fallbackTimeoutId)
            
            if (error) {
              console.error('❌ Erro na verificação de fallback:', error)
              
              if (globalCache?.user) {
                console.log('📦 Usando cache após erro de fallback')
                setAuthState({
                  user: globalCache.user,
                  isLoading: false,
                  isAuthenticated: true
                })
              } else {
                setAuthState({
                  user: null,
                  isLoading: false,
                  isAuthenticated: false
                })
              }
              return
            }
            
            if (session?.user) {
              console.log('✅ Sessão recuperada no fallback')
              loadUserProfile(session.user, true)
            } else {
              console.log('❌ Nenhuma sessão no fallback')
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          })
          .catch((error) => {
            clearTimeout(fallbackTimeoutId)
            console.error('❌ Erro crítico no fallback:', error)
            
            if (globalCache?.user) {
              console.log('📦 Usando cache após erro crítico')
              setAuthState({
                user: globalCache.user,
                isLoading: false,
                isAuthenticated: true
              })
            } else {
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          })
        
        isInitializing = false
        initializationPromise = null
      }
    }, FAST_INIT_TIMEOUT)
    
    // Função de inicialização ultra-otimizada com retry inteligente
    const initializeAuth = async () => {
      // Evitar múltiplas inicializações simultâneas
      if (isInitializing) {
        if (initializationPromise) {
          await initializationPromise
        }
        return
      }
      
      isInitializing = true
      
      // Função auxiliar para retry com backoff exponencial
      const attemptAuthWithRetry = async (attempt: number = 0): Promise<void> => {
        try {
          console.log(`🔄 Tentativa de autenticação ${attempt + 1}/${MAX_RETRIES + 1}`)
          
          const { data: { session }, error } = await networkOptimizer.optimizedRequest(
            `auth_session_attempt_${attempt}`,
            () => supabase.auth.getSession(),
            { priority: 'high', timeout: 5000 + (attempt * 2000) } // Timeout crescente
          )
          
          if (!isMountedRef.current) {
            return
          }
          
          // Limpar timeout pois a verificação foi concluída
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current)
            initTimeoutRef.current = null
          }
          
          if (error) {
            throw error
          }
          
          if (session?.user) {
            console.log('✅ Sessão encontrada, carregando perfil...')
            // Iniciar pré-carregamento em paralelo
            performanceOptimizer.preloadCriticalData(session.user.id)
            
            await loadUserProfile(session.user)
          } else {
            console.log('ℹ️ Nenhuma sessão ativa')
            if (isMountedRef.current) {
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          }
          
        } catch (error) {
          console.error(`❌ Erro na tentativa ${attempt + 1}:`, error)
          
          // Se ainda há tentativas disponíveis, fazer retry
          if (attempt < MAX_RETRIES && isMountedRef.current) {
            const delay = RETRY_DELAYS[attempt] || 4000
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
            
            await new Promise(resolve => setTimeout(resolve, delay))
            
            if (isMountedRef.current) {
              retryCount = attempt + 1
              return attemptAuthWithRetry(attempt + 1)
            }
          } else {
            // Esgotaram as tentativas ou componente desmontado
            console.error('❌ Todas as tentativas de autenticação falharam')
            
            // Tentar modo offline como último recurso
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('network'))) {
              console.log('🔄 Tentando modo offline...')
              try {
                const cachedSession = localStorage.getItem('supabase.auth.token')
                if (cachedSession) {
                  console.log('📱 Usando sessão em cache')
                  if (isMountedRef.current) {
                    setAuthState({
                      isLoading: false,
                      isAuthenticated: true,
                      user: null // Será carregado depois
                    })
                  }
                  return
                }
              } catch (cacheError) {
                console.error('Erro ao verificar cache:', cacheError)
              }
            }
            
            if (isMountedRef.current) {
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          }
        }
      }
      
      initializationPromise = performanceOptimizer.measurePerformance(
          'Auth Initialization',
          async () => {
            const authStartTime = performance.now()
            try {
              console.log('🚀 Inicialização ultra-otimizada com retry inteligente...')
              await attemptAuthWithRetry(0)
            } finally {
              // Registrar tempo de inicialização
              const authDuration = performance.now() - authStartTime
              performanceMonitor.recordOperationTime('Auth Initialization', authDuration)
              
              console.log('📊 Estatísticas de autenticação:', {
                duration: `${authDuration.toFixed(2)}ms`,
                retries: retryCount,
                success: authState.isAuthenticated,
                timestamp: new Date().toISOString()
              })
              
              isInitializing = false
              initializationPromise = null
            }
          }
        )
      
      await initializationPromise
    }

    initializeAuth()

    // Escutar mudanças de autenticação (simplificado)
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
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    )

    return () => {
      isMountedRef.current = false
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      subscription.unsubscribe()
      isInitializing = false
      initializationPromise = null
    }
  }, []) // Sem dependências para evitar re-execuções desnecessárias

  const loadUserProfile = useCallback(async (authUser: SupabaseUser, useCache = true) => {
    if (!isMountedRef.current) return
    
    const profileStartTime = performance.now()
    
    console.log('👤 Carregando perfil do usuário:', {
      userId: authUser.id,
      email: authUser.email,
      useCache,
      timestamp: new Date().toISOString()
    })
    
    // Verificar cache primeiro para performance ultra-rápida
    if (useCache && globalCache && globalCache.sessionId === authUser.id && 
        Date.now() - globalCache.timestamp < CACHE_DURATION) {
      const cacheAge = Date.now() - globalCache.timestamp
      console.log('📦 Usando dados do cache:', {
        cacheAge: `${cacheAge}ms`,
        user: globalCache.user.nome
      })
      
      setAuthState({
        user: globalCache.user,
        isLoading: false,
        isAuthenticated: true
      })
      
      const profileDuration = performance.now() - profileStartTime
      performanceMonitor.recordOperationTime('Profile Load (Cache)', profileDuration)
      return
    }
    
    try {
      console.log('🔍 Buscando perfil no banco de dados...')
      console.log('🚀 Carregamento otimizado do perfil:', authUser.email)
      
      // Query ultra-otimizada com cache inteligente
      const userData = await performanceOptimizer.getCachedQuery(
        `user_profile_${authUser.id}`,
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('id, email, nome, is_admin, onboarding_completed')
            .eq('id', authUser.id)
            .single()
          
          if (error) throw error
          return data
        },
        5 * 60 * 1000 // 5 minutos de cache
      ).catch(() => null)

      let user: User

      if (!userData) {
        console.log('📝 Perfil baseado no Auth (fallback otimizado)')
        user = {
          id: authUser.id,
          email: authUser.email || '',
          nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
          tipo: 'profissional',
          is_admin: false,
          onboarding_completed: false
        }
        
        const profileDuration = performance.now() - profileStartTime
        performanceMonitor.recordOperationTime('Profile Load (Fallback)', profileDuration)
        
        console.log('📊 Estatísticas de carregamento de perfil (fallback):', {
          duration: `${profileDuration.toFixed(2)}ms`,
          fallbackUser: user.nome,
          timestamp: new Date().toISOString()
        })
      } else {
        console.log('✅ Perfil carregado com sucesso do banco:', userData.nome)
        console.log('✅ Perfil carregado com otimização ultra-avançada')
        user = {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          tipo: userData.is_admin ? 'admin' : 'profissional',
          is_admin: userData.is_admin,
          onboarding_completed: userData.onboarding_completed
        }
        
        const profileDuration = performance.now() - profileStartTime
        performanceMonitor.recordOperationTime('Profile Load (Database)', profileDuration)
        
        console.log('📊 Estatísticas de carregamento de perfil:', {
          duration: `${profileDuration.toFixed(2)}ms`,
          user: user.nome,
          source: 'database',
          timestamp: new Date().toISOString()
        })
      }

      // Atualizar cache global para próximas consultas
      globalCache = {
        user,
        timestamp: Date.now(),
        sessionId: authUser.id
      }
      
      console.log('💾 Cache atualizado para o usuário:', user.nome)

      if (isMountedRef.current) {
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
      }
    } catch (error) {
      console.error('❌ Erro crítico ao carregar perfil:', error)
      console.log('🔄 Usando fallback de emergência...')
      console.log('⚠️ Fallback otimizado ativado:', error)
      
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
        tipo: 'profissional',
        is_admin: false,
        onboarding_completed: false
      }

      // Cache mesmo em fallback para consistência
      globalCache = {
        user,
        timestamp: Date.now(),
        sessionId: authUser.id
      }
      
      const profileDuration = performance.now() - profileStartTime
      performanceMonitor.recordOperationTime('Profile Load (Critical Error)', profileDuration)
      
      console.log('📊 Estatísticas de carregamento de perfil (erro crítico):', {
        duration: `${profileDuration.toFixed(2)}ms`,
        fallbackUser: user.nome,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })

      if (isMountedRef.current) {
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const loginStartTime = performance.now()
    let loginAttempt = 0
    const MAX_LOGIN_RETRIES = 2
    
    console.log('🔐 Iniciando processo de login para:', email)
    
    const attemptLogin = async (attempt: number): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log(`🔄 Tentativa de login ${attempt + 1}/${MAX_LOGIN_RETRIES + 1}`)
        setAuthState(prev => ({ ...prev, isLoading: true }))
        
        // Invalidar cache antes do login para garantir dados frescos
        if (attempt === 0) {
          globalCache = null
          performanceOptimizer.invalidateCache('user_')
        }
        
        const { data, error } = await networkOptimizer.optimizedRequest(
          `login_${email}_attempt_${attempt}`,
          () => supabase.auth.signInWithPassword({ email, password }),
          { priority: 'high', timeout: 5000 + (attempt * 2000) }
        )

        if (error) {
          console.error(`❌ Erro no login (tentativa ${attempt + 1}):`, error)
          
          // Se ainda há tentativas disponíveis e é um erro de rede/timeout
          if (attempt < MAX_LOGIN_RETRIES && 
              (error.message.includes('timeout') || 
               error.message.includes('network') || 
               error.message.includes('fetch'))) {
            
            const delay = 1000 * (attempt + 1) // 1s, 2s, 3s
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa de login...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            return attemptLogin(attempt + 1)
          }
          
          setAuthState(prev => ({ ...prev, isLoading: false }))
          return { success: false, error: error.message }
        }

        if (data.user) {
          console.log('✅ Login bem-sucedido, carregando perfil do usuário...')
          
          // Forçar carregamento sem cache para login fresco
          await loadUserProfile(data.user, false)
          
          // Registrar tempo de login bem-sucedido
          const loginDuration = performance.now() - loginStartTime
          performanceMonitor.recordOperationTime('Login Success', loginDuration)
          
          console.log('📊 Estatísticas de login:', {
            duration: `${loginDuration.toFixed(2)}ms`,
            attempts: attempt + 1,
            email: email,
            timestamp: new Date().toISOString()
          })
          
          return { success: true }
        }
        
        console.error('❌ Login falhou: usuário não retornado')
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: 'Falha na autenticação' }
        
      } catch (error) {
        console.error(`❌ Erro crítico no login (tentativa ${attempt + 1}):`, error)
        
        // Se ainda há tentativas disponíveis
        if (attempt < MAX_LOGIN_RETRIES) {
          const delay = 1000 * (attempt + 1)
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa de login...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return attemptLogin(attempt + 1)
        }
        
        // Registrar tempo de login com erro
        const loginDuration = performance.now() - loginStartTime
        performanceMonitor.recordOperationTime('Login Error', loginDuration)
        
        console.log('📊 Estatísticas de login (erro):', {
          duration: `${loginDuration.toFixed(2)}ms`,
          attempts: attempt + 1,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        })
        
        // Limpar cache em caso de erro
        globalCache = null
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: 'Erro interno do servidor' }
      }
    }
    
    return attemptLogin(0)
  }, [loadUserProfile])

  const register = async (email: string, password: string, nome: string): Promise<{ success: boolean; error?: string }> => {

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
    const logoutStartTime = performance.now()
    
    try {
      console.log('🚪 Iniciando processo de logout...')
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      // Limpar cache antes do logout
      globalCache = null
      performanceOptimizer.invalidateCache('user_')
      
      console.log('🧹 Cache limpo, executando logout no Supabase...')
      await networkOptimizer.optimizedRequest(
        'logout',
        () => supabase.auth.signOut(),
        { priority: 'high', timeout: 3000 }
      )
      
      const logoutDuration = performance.now() - logoutStartTime
      performanceMonitor.recordOperationTime('Logout Success', logoutDuration)
      
      console.log('✅ Logout realizado com sucesso')
      console.log('📊 Estatísticas de logout:', {
        duration: `${logoutDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    } catch (error) {
      const logoutDuration = performance.now() - logoutStartTime
      performanceMonitor.recordOperationTime('Logout Error', logoutDuration)
      
      console.error('❌ Erro no logout:', error)
      console.log('📊 Estatísticas de logout (erro):', {
        duration: `${logoutDuration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
      
      // Garantir que cache seja limpo mesmo em caso de erro
      console.log('🧹 Limpando estado local mesmo com erro...')
      globalCache = null
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {

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