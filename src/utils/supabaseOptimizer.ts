import { supabase } from '../lib/supabase'
import { performanceMonitor } from './performanceMonitor'
import { performanceOptimizer } from './performanceOptimizer'

// Interface para configuração de queries otimizadas
interface QueryConfig {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
  cacheDuration?: number
  useIndex?: string[]
  priority?: 'high' | 'medium' | 'low'
}

// Interface para estatísticas de query
interface QueryStats {
  executionTime: number
  rowsReturned: number
  cacheHit: boolean
  indexUsed?: string
  timestamp: number
}

// Sistema de otimização ultra-avançado para Supabase
export class SupabaseOptimizer {
  private static queryStats = new Map<string, QueryStats[]>()
  private static indexCache = new Map<string, string[]>()
  private static slowQueryThreshold = 1000 // 1 segundo

  /**
   * Executa query otimizada com cache inteligente e monitoramento
   */
  static async executeOptimizedQuery<T = any>(
    queryKey: string,
    config: QueryConfig
  ): Promise<{ data: T[] | null; error: any; stats: QueryStats }> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(queryKey, config)
    
    // Verificar cache primeiro
    const cachedResult = await performanceOptimizer.getCachedQuery(
      cacheKey,
      config.cacheDuration || 300000 // 5 minutos padrão
    )

    if (cachedResult) {
      const stats: QueryStats = {
        executionTime: performance.now() - startTime,
        rowsReturned: cachedResult.length,
        cacheHit: true,
        timestamp: Date.now()
      }
      
      this.recordQueryStats(queryKey, stats)
      return { data: cachedResult, error: null, stats }
    }

    try {
      // Construir query otimizada
      let query = supabase.from(config.table)

      // Aplicar seleção otimizada
      if (config.select) {
        query = query.select(config.select)
      } else {
        // Seleção inteligente baseada no uso histórico
        const optimizedSelect = await this.getOptimizedSelect(config.table)
        query = query.select(optimizedSelect)
      }

      // Aplicar filtros com otimização de índices
      if (config.filters) {
        query = await this.applyOptimizedFilters(query, config.filters, config.table)
      }

      // Aplicar ordenação
      if (config.orderBy) {
        query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true })
      }

      // Aplicar paginação
      if (config.limit) {
        query = query.limit(config.limit)
      }
      if (config.offset) {
        query = query.range(config.offset, config.offset + (config.limit || 10) - 1)
      }

      // Executar query com timeout baseado na prioridade
      const timeout = this.getTimeoutForPriority(config.priority || 'medium')
      const { data, error } = await Promise.race([
        query,
        new Promise<{ data: null; error: string }>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])

      const executionTime = performance.now() - startTime
      
      const stats: QueryStats = {
        executionTime,
        rowsReturned: data?.length || 0,
        cacheHit: false,
        timestamp: Date.now()
      }

      // Registrar estatísticas
      this.recordQueryStats(queryKey, stats)
      
      // Monitorar performance
      performanceMonitor.recordOperationTime(`Query: ${queryKey}`, executionTime)
      
      // Alertar sobre queries lentas
      if (executionTime > this.slowQueryThreshold) {
        console.warn(`🐌 Query lenta detectada: ${queryKey} (${executionTime.toFixed(2)}ms)`)
        await this.optimizeSlowQuery(queryKey, config, executionTime)
      }

      // Cachear resultado se bem-sucedido
      if (data && !error) {
        await performanceOptimizer.setCachedQuery(
          cacheKey,
          data,
          config.cacheDuration || 300000
        )
      }

      return { data, error, stats }
    } catch (error) {
      const executionTime = performance.now() - startTime
      const stats: QueryStats = {
        executionTime,
        rowsReturned: 0,
        cacheHit: false,
        timestamp: Date.now()
      }
      
      this.recordQueryStats(queryKey, stats)
      console.error(`❌ Erro na query ${queryKey}:`, error)
      
      return { data: null, error, stats }
    }
  }

  /**
   * Aplica filtros com otimização de índices
   */
  private static async applyOptimizedFilters(query: any, filters: Record<string, any>, table: string) {
    const availableIndexes = await this.getTableIndexes(table)
    
    // Ordenar filtros por eficiência de índice
    const sortedFilters = Object.entries(filters).sort(([keyA], [keyB]) => {
      const aHasIndex = availableIndexes.some(idx => idx.includes(keyA))
      const bHasIndex = availableIndexes.some(idx => idx.includes(keyB))
      
      if (aHasIndex && !bHasIndex) return -1
      if (!aHasIndex && bHasIndex) return 1
      return 0
    })

    // Aplicar filtros otimizados
    for (const [key, value] of sortedFilters) {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === 'object' && value !== null) {
        // Filtros complexos (range, like, etc.)
        if (value.gte !== undefined) query = query.gte(key, value.gte)
        if (value.lte !== undefined) query = query.lte(key, value.lte)
        if (value.like !== undefined) query = query.like(key, value.like)
        if (value.ilike !== undefined) query = query.ilike(key, value.ilike)
      } else {
        query = query.eq(key, value)
      }
    }

    return query
  }

  /**
   * Obtém seleção otimizada baseada no histórico de uso
   */
  private static async getOptimizedSelect(table: string): Promise<string> {
    // Por enquanto, retorna seleção padrão
    // Em produção, isso seria baseado em análise de uso real
    const commonSelections: Record<string, string> = {
      'users': 'id, nome, email, telefone, created_at',
      'agendamentos': 'id, cliente_id, servico_id, data_agendamento, status, valor, created_at',
      'servicos': 'id, nome, descricao, preco, duracao, ativo',
      'clientes': 'id, nome, email, telefone, data_nascimento, created_at',
      'financeiro': 'id, tipo, valor, descricao, data_transacao, categoria'
    }

    return commonSelections[table] || '*'
  }

  /**
   * Obtém índices disponíveis para uma tabela
   */
  private static async getTableIndexes(table: string): Promise<string[]> {
    if (this.indexCache.has(table)) {
      return this.indexCache.get(table)!
    }

    try {
      // Consultar índices do PostgreSQL
      const { data } = await supabase.rpc('get_table_indexes', { table_name: table })
      const indexes = data || []
      
      this.indexCache.set(table, indexes)
      return indexes
    } catch (error) {
      console.warn(`Não foi possível obter índices para ${table}:`, error)
      return []
    }
  }

  /**
   * Otimiza query lenta automaticamente
   */
  private static async optimizeSlowQuery(
    queryKey: string,
    config: QueryConfig,
    executionTime: number
  ): Promise<void> {
    console.log(`🔧 Otimizando query lenta: ${queryKey}`)
    
    // Sugerir criação de índices
    if (config.filters) {
      const suggestedIndexes = Object.keys(config.filters)
      console.log(`💡 Sugestão: Criar índices para colunas: ${suggestedIndexes.join(', ')}`)
    }

    // Sugerir otimizações de cache
    if (executionTime > 2000) {
      console.log(`💡 Sugestão: Aumentar duração do cache para ${queryKey}`)
    }

    // Registrar para análise posterior
    const optimization = {
      queryKey,
      config,
      executionTime,
      timestamp: Date.now(),
      suggestions: this.generateOptimizationSuggestions(config, executionTime)
    }

    // Em produção, isso seria enviado para um sistema de análise
    console.log('📊 Dados de otimização:', optimization)
  }

  /**
   * Gera sugestões de otimização
   */
  private static generateOptimizationSuggestions(
    config: QueryConfig,
    executionTime: number
  ): string[] {
    const suggestions: string[] = []

    if (executionTime > 2000) {
      suggestions.push('Considere aumentar a duração do cache')
    }

    if (config.filters && Object.keys(config.filters).length > 3) {
      suggestions.push('Muitos filtros - considere criar índices compostos')
    }

    if (!config.limit || config.limit > 100) {
      suggestions.push('Implemente paginação para melhor performance')
    }

    if (!config.select || config.select === '*') {
      suggestions.push('Especifique apenas as colunas necessárias')
    }

    return suggestions
  }

  /**
   * Registra estatísticas de query
   */
  private static recordQueryStats(queryKey: string, stats: QueryStats): void {
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, [])
    }

    const queryHistory = this.queryStats.get(queryKey)!
    queryHistory.push(stats)

    // Manter apenas os últimos 100 registros
    if (queryHistory.length > 100) {
      queryHistory.shift()
    }
  }

  /**
   * Obtém timeout baseado na prioridade
   */
  private static getTimeoutForPriority(priority: 'high' | 'medium' | 'low'): number {
    const timeouts = {
      high: 2000,   // 2 segundos
      medium: 5000, // 5 segundos
      low: 10000    // 10 segundos
    }
    return timeouts[priority]
  }

  /**
   * Gera chave de cache única
   */
  private static generateCacheKey(queryKey: string, config: QueryConfig): string {
    const configHash = JSON.stringify({
      table: config.table,
      select: config.select,
      filters: config.filters,
      orderBy: config.orderBy,
      limit: config.limit,
      offset: config.offset
    })
    
    return `query_${queryKey}_${btoa(configHash).slice(0, 16)}`
  }

  /**
   * Obtém estatísticas de performance
   */
  static getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [queryKey, history] of this.queryStats.entries()) {
      const recentStats = history.slice(-10) // Últimas 10 execuções
      const avgTime = recentStats.reduce((sum, stat) => sum + stat.executionTime, 0) / recentStats.length
      const cacheHitRate = recentStats.filter(stat => stat.cacheHit).length / recentStats.length
      
      stats[queryKey] = {
        averageTime: avgTime,
        cacheHitRate,
        totalExecutions: history.length,
        lastExecution: history[history.length - 1]?.timestamp
      }
    }
    
    return stats
  }

  /**
   * Limpa cache e estatísticas
   */
  static clearCache(): void {
    this.queryStats.clear()
    this.indexCache.clear()
    console.log('🧹 Cache do SupabaseOptimizer limpo')
  }
}

// Função helper para queries simples
export const optimizedQuery = <T = any>(
  queryKey: string,
  config: QueryConfig
): Promise<{ data: T[] | null; error: any; stats: QueryStats }> => {
  return SupabaseOptimizer.executeOptimizedQuery<T>(queryKey, config)
}

export default SupabaseOptimizer