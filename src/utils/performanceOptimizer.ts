// Sistema de otimização de performance ultra-avançado
import { supabase } from '../lib/supabase'

// Cache de queries frequentes
interface QueryCache {
  [key: string]: {
    data: any
    timestamp: number
    ttl: number
  }
}

const queryCache: QueryCache = {}
const CACHE_TTL = {
  user: 5 * 60 * 1000, // 5 minutos
  static: 30 * 60 * 1000, // 30 minutos
  dynamic: 1 * 60 * 1000 // 1 minuto
}

// Sistema de pré-carregamento inteligente
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private isPreloading = false

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Cache inteligente com TTL
  async getCachedQuery(key: string, queryFn: () => Promise<any>, ttl: number = CACHE_TTL.dynamic): Promise<any> {
    const cached = queryCache[key]
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`⚡ Cache hit para: ${key}`)
      return cached.data
    }

    console.log(`🔄 Executando query: ${key}`)
    const data = await queryFn()
    
    queryCache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    }

    return data
  }

  // Pré-carregamento de dados críticos
  async preloadCriticalData(userId: string): Promise<void> {
    if (this.isPreloading) return
    
    this.isPreloading = true
    console.log('🚀 Iniciando pré-carregamento de dados críticos')

    try {
      // Pré-carregar dados do usuário
      await this.getCachedQuery(
        `user_${userId}`,
        async () => {
          const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
          return { data, error }
        },
        CACHE_TTL.user
      )

      // Pré-carregar configurações do sistema
      await this.getCachedQuery(
        'system_config',
        async () => {
          const { data, error } = await supabase.from('configuracoes').select('*')
          return { data, error }
        },
        CACHE_TTL.static
      )

      console.log('✅ Pré-carregamento concluído')
    } catch (error) {
      console.warn('⚠️ Erro no pré-carregamento:', error)
    } finally {
      this.isPreloading = false
    }
  }

  // Invalidar cache específico
  invalidateCache(pattern?: string): void {
    if (pattern) {
      Object.keys(queryCache).forEach(key => {
        if (key.includes(pattern)) {
          delete queryCache[key]
          console.log(`🗑️ Cache invalidado: ${key}`)
        }
      })
    } else {
      Object.keys(queryCache).forEach(key => delete queryCache[key])
      console.log('🗑️ Todo cache invalidado')
    }
  }

  // Limpeza automática de cache expirado
  cleanExpiredCache(): void {
    const now = Date.now()
    Object.keys(queryCache).forEach(key => {
      const cached = queryCache[key]
      if (now - cached.timestamp > cached.ttl) {
        delete queryCache[key]
      }
    })
  }

  // Otimização de queries do Supabase
  optimizeSupabaseQuery(query: any): any {
    // Adicionar índices automáticos e otimizações
    return query
      .limit(100) // Limitar resultados por padrão
      .order('created_at', { ascending: false }) // Ordenação otimizada
  }

  // Monitoramento de performance
  measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    
    return fn().then(result => {
      const duration = performance.now() - start
      console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`)
      
      // Alertar sobre operações lentas
      if (duration > 1000) {
        console.warn(`🐌 Operação lenta detectada: ${operation} (${duration.toFixed(2)}ms)`)
      }
      
      return result
    })
  }
}

// Instância global
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Inicialização automática de limpeza de cache
setInterval(() => {
  performanceOptimizer.cleanExpiredCache()
}, 60000) // A cada minuto