import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { performanceMonitor } from './performanceMonitor'

// Interface para componentes com lazy loading
interface LazyComponentConfig {
  importFn: () => Promise<{ default: ComponentType<any> }>
  fallback?: ComponentType
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
}

// Cache para componentes pré-carregados
const preloadCache = new Map<string, Promise<{ default: ComponentType<any> }>>()

// Sistema de lazy loading ultra-otimizado
export class LazyLoader {
  private static componentCache = new Map<string, LazyExoticComponent<ComponentType<any>>>()
  private static preloadQueue: Array<{ key: string; config: LazyComponentConfig }> = []
  private static isPreloading = false

  /**
   * Cria um componente lazy com otimizações avançadas
   */
  static createLazyComponent<T extends ComponentType<any>>(
    key: string,
    config: LazyComponentConfig
  ): LazyExoticComponent<T> {
    // Verificar cache primeiro
    if (this.componentCache.has(key)) {
      return this.componentCache.get(key) as LazyExoticComponent<T>
    }

    // Criar componente lazy com medição de performance
    const lazyComponent = lazy(async () => {
      const startTime = performance.now()
      
      try {
        // Verificar se já foi pré-carregado
        let modulePromise = preloadCache.get(key)
        
        if (!modulePromise) {
          modulePromise = config.importFn()
          preloadCache.set(key, modulePromise)
        }
        
        const module = await modulePromise
        
        // Registrar tempo de carregamento
        const loadTime = performance.now() - startTime
        performanceMonitor.recordOperationTime(`Lazy Load: ${key}`, loadTime)
        
        console.log(`🚀 Componente ${key} carregado em ${loadTime.toFixed(2)}ms`)
        
        return module
      } catch (error) {
        console.error(`❌ Erro ao carregar componente ${key}:`, error)
        throw error
      }
    })

    // Adicionar ao cache
    this.componentCache.set(key, lazyComponent)

    // Adicionar à fila de pré-carregamento se necessário
    if (config.preload) {
      this.addToPreloadQueue(key, config)
    }

    return lazyComponent as LazyExoticComponent<T>
  }

  /**
   * Pré-carrega um componente específico
   */
  static async preloadComponent(key: string, importFn: () => Promise<{ default: ComponentType<any> }>): Promise<void> {
    if (preloadCache.has(key)) {
      return
    }

    const startTime = performance.now()
    
    try {
      const modulePromise = importFn()
      preloadCache.set(key, modulePromise)
      
      await modulePromise
      
      const preloadTime = performance.now() - startTime
      performanceMonitor.recordOperationTime(`Preload: ${key}`, preloadTime)
      
      console.log(`⚡ Componente ${key} pré-carregado em ${preloadTime.toFixed(2)}ms`)
    } catch (error) {
      console.error(`❌ Erro ao pré-carregar componente ${key}:`, error)
      preloadCache.delete(key)
    }
  }

  /**
   * Adiciona componente à fila de pré-carregamento
   */
  private static addToPreloadQueue(key: string, config: LazyComponentConfig): void {
    this.preloadQueue.push({ key, config })
    this.processPreloadQueue()
  }

  /**
   * Processa a fila de pré-carregamento com priorização
   */
  private static async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    // Ordenar por prioridade
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    this.preloadQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.config.priority || 'medium']
      const bPriority = priorityOrder[b.config.priority || 'medium']
      return aPriority - bPriority
    })

    // Processar em lotes para não sobrecarregar
    const batchSize = 3
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, batchSize)
      
      await Promise.allSettled(
        batch.map(({ key, config }) => 
          this.preloadComponent(key, config.importFn)
        )
      )

      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    this.isPreloading = false
  }

  /**
   * Pré-carrega componentes críticos baseado na rota atual
   */
  static preloadCriticalComponents(currentRoute: string): void {
    const criticalComponents = this.getCriticalComponentsForRoute(currentRoute)
    
    criticalComponents.forEach(({ key, importFn }) => {
      this.preloadComponent(key, importFn)
    })
  }

  /**
   * Retorna componentes críticos para uma rota específica
   */
  private static getCriticalComponentsForRoute(route: string): Array<{ key: string; importFn: () => Promise<{ default: ComponentType<any> }> }> {
    const routeMap: Record<string, Array<{ key: string; importFn: () => Promise<{ default: ComponentType<any> }> }>> = {
      '/': [
        { key: 'Dashboard', importFn: () => import('../pages/Dashboard') },
        // { key: 'ServiceCard', importFn: () => import('../components/ServiceCard') }
      ],
      '/clientes': [
        { key: 'ClientesPage', importFn: () => import('../pages/ClientesPage') }
      ],
      '/configuracoes': [
        { key: 'ConfiguracoesPage', importFn: () => import('../pages/ConfiguracoesPage') }
      ],
      '/parcerias': [
        { key: 'ParceriasPage', importFn: () => import('../pages/ParceriasPage') }
      ],
      '/minhas-imagens': [
        { key: 'MinhasImagensPage', importFn: () => import('../pages/MinhasImagensPage') }
      ],
      '/aplicar-cilios': [
        { key: 'AplicarCiliosPage', importFn: () => import('../pages/AplicarCiliosPage') }
      ]
    }

    return routeMap[route] || []
  }

  /**
   * Limpa o cache de componentes (útil para desenvolvimento)
   */
  static clearCache(): void {
    this.componentCache.clear()
    preloadCache.clear()
    this.preloadQueue.length = 0
    console.log('🧹 Cache de componentes limpo')
  }

  /**
   * Retorna estatísticas do cache
   */
  static getCacheStats(): { cached: number; preloaded: number; queued: number } {
    return {
      cached: this.componentCache.size,
      preloaded: preloadCache.size,
      queued: this.preloadQueue.length
    }
  }
}

// Função helper para criar componentes lazy facilmente
export const createLazyComponent = <T extends ComponentType<any>>(
  key: string,
  importFn: () => Promise<{ default: T }>,
  options: Omit<LazyComponentConfig, 'importFn'> = {}
): LazyExoticComponent<T> => {
  return LazyLoader.createLazyComponent<T>(key, {
    importFn,
    ...options
  })
}

// Hook para pré-carregamento baseado em interação do usuário
export const usePreloadOnHover = (componentKey: string, importFn: () => Promise<{ default: ComponentType<any> }>) => {
  return {
    onMouseEnter: () => LazyLoader.preloadComponent(componentKey, importFn),
    onFocus: () => LazyLoader.preloadComponent(componentKey, importFn)
  }
}

export default LazyLoader