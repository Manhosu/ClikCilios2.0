// Sistema de otimização de rede ultra-avançado
import { supabase } from '../lib/supabase'

// Configurações de otimização de rede
const NETWORK_CONFIG = {
  maxRetries: 5,
  retryDelay: 1000,
  timeout: 15000, // Aumentado para 15 segundos
  batchSize: 10,
  compressionThreshold: 1024 // bytes
}

// Sistema de retry inteligente
export class NetworkOptimizer {
  private static instance: NetworkOptimizer
  private requestQueue: Map<string, Promise<any>> = new Map()
  private connectionQuality: 'fast' | 'slow' | 'offline' = 'fast'

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer()
      NetworkOptimizer.instance.initNetworkMonitoring()
    }
    return NetworkOptimizer.instance
  }

  // Monitoramento de qualidade de rede
  private initNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnectionQuality = () => {
        const effectiveType = connection.effectiveType
        
        if (effectiveType === '4g' || effectiveType === '3g') {
          this.connectionQuality = 'fast'
        } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          this.connectionQuality = 'slow'
        }
        
        console.log(`📶 Qualidade de rede: ${this.connectionQuality} (${effectiveType})`)
      }
      
      connection.addEventListener('change', updateConnectionQuality)
      updateConnectionQuality()
    }

    // Detectar offline/online
    window.addEventListener('online', () => {
      this.connectionQuality = 'fast'
      console.log('🌐 Conexão restaurada')
    })
    
    window.addEventListener('offline', () => {
      this.connectionQuality = 'offline'
      console.log('📵 Conexão perdida')
    })
  }

  // Request com retry inteligente
  async optimizedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      retries?: number
      timeout?: number
      priority?: 'high' | 'normal' | 'low'
    } = {}
  ): Promise<T> {
    const {
      retries = NETWORK_CONFIG.maxRetries,
      timeout = NETWORK_CONFIG.timeout,
      priority = 'normal'
    } = options

    // Deduplicação de requests
    if (this.requestQueue.has(key)) {
      console.log(`🔄 Request deduplicated: ${key}`)
      return this.requestQueue.get(key)!
    }

    const requestPromise = this.executeWithRetry(
      requestFn,
      retries,
      timeout,
      priority
    )

    this.requestQueue.set(key, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.requestQueue.delete(key)
    }
  }

  // Execução com retry e timeout
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number,
    timeout: number,
    priority: 'high' | 'normal' | 'low'
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Ajustar timeout baseado na qualidade da rede
        const adjustedTimeout = this.getAdjustedTimeout(timeout, priority)
        
        const result = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), adjustedTimeout)
          )
        ])

        if (attempt > 0) {
          console.log(`✅ Request succeeded after ${attempt} retries`)
        }

        return result
      } catch (error) {
        lastError = error as Error
        
        if (attempt < retries) {
          const delay = this.getRetryDelay(attempt, priority)
          console.log(`🔄 Retry ${attempt + 1}/${retries} in ${delay}ms: ${lastError.message}`)
          await this.delay(delay)
        }
      }
    }

    console.error(`❌ Request failed after ${retries} retries:`, lastError)
    throw lastError
  }

  // Timeout ajustado baseado na qualidade da rede
  private getAdjustedTimeout(baseTimeout: number, priority: 'high' | 'normal' | 'low'): number {
    let multiplier = 1

    // Ajustar baseado na qualidade da rede
    if (this.connectionQuality === 'slow') {
      multiplier *= 2
    } else if (this.connectionQuality === 'offline') {
      multiplier *= 0.5 // Falhar mais rápido se offline
    }

    // Ajustar baseado na prioridade
    if (priority === 'high') {
      multiplier *= 1.5
    } else if (priority === 'low') {
      multiplier *= 0.7
    }

    return Math.round(baseTimeout * multiplier)
  }

  // Delay inteligente para retry
  private getRetryDelay(attempt: number, priority: 'high' | 'normal' | 'low'): number {
    const baseDelay = NETWORK_CONFIG.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    
    // Ajustar baseado na prioridade
    let multiplier = 1
    if (priority === 'high') {
      multiplier = 0.5 // Retry mais rápido para alta prioridade
    } else if (priority === 'low') {
      multiplier = 2 // Retry mais lento para baixa prioridade
    }

    return Math.min(exponentialDelay * multiplier, 5000) // Max 5 segundos
  }

  // Utility para delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch requests para otimização
  async batchRequests<T>(
    requests: Array<{ key: string; fn: () => Promise<T> }>,
    batchSize: number = NETWORK_CONFIG.batchSize
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      
      const batchPromises = batch.map(({ key, fn }) => 
        this.optimizedRequest(key, fn, { priority: 'normal' })
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`❌ Batch request failed: ${batch[index].key}`, result.reason)
        }
      })
      
      // Pequeno delay entre batches para não sobrecarregar
      if (i + batchSize < requests.length) {
        await this.delay(100)
      }
    }
    
    return results
  }

  // Otimização específica para Supabase
  optimizeSupabaseQuery(query: any): any {
    return query
      .abortSignal(AbortSignal.timeout(this.getAdjustedTimeout(5000, 'high')))
  }

  // Status da rede
  getNetworkStatus(): {
    quality: string
    isOnline: boolean
    pendingRequests: number
  } {
    return {
      quality: this.connectionQuality,
      isOnline: navigator.onLine,
      pendingRequests: this.requestQueue.size
    }
  }
}

// Instância global
export const networkOptimizer = NetworkOptimizer.getInstance()