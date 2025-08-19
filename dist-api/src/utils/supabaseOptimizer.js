import { supabase } from '../lib/supabase';
import { performanceMonitor } from './performanceMonitor';
import { performanceOptimizer } from './performanceOptimizer';
export class SupabaseOptimizer {
    static async executeOptimizedQuery(queryKey, config) {
        const startTime = performance.now();
        const cacheKey = this.generateCacheKey(queryKey, config);
        const cachedResult = await performanceOptimizer.getCachedQuery(cacheKey, async () => null, 0).catch(() => null);
        if (cachedResult) {
            const stats = {
                executionTime: performance.now() - startTime,
                rowsReturned: cachedResult.length,
                cacheHit: true,
                timestamp: Date.now()
            };
            this.recordQueryStats(queryKey, stats);
            return { data: cachedResult, error: null, stats };
        }
        try {
            let query = supabase.from(config.table);
            if (config.select) {
                query = query.select(config.select);
            }
            else {
                const optimizedSelect = await this.getOptimizedSelect(config.table);
                query = query.select(optimizedSelect);
            }
            if (config.filters) {
                query = await this.applyOptimizedFilters(query, config.filters, config.table);
            }
            if (config.orderBy) {
                query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true });
            }
            if (config.limit) {
                query = query.limit(config.limit);
            }
            if (config.offset) {
                query = query.range(config.offset, config.offset + (config.limit || 10) - 1);
            }
            const timeout = this.getTimeoutForPriority(config.priority || 'medium');
            const result = await Promise.race([
                query,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), timeout))
            ]);
            const { data, error } = result;
            const executionTime = performance.now() - startTime;
            const stats = {
                executionTime,
                rowsReturned: data?.length || 0,
                cacheHit: false,
                timestamp: Date.now()
            };
            this.recordQueryStats(queryKey, stats);
            performanceMonitor.recordOperationTime(`Query: ${queryKey}`, executionTime);
            if (executionTime > this.slowQueryThreshold) {
                console.warn(`🐌 Query lenta detectada: ${queryKey} (${executionTime.toFixed(2)}ms)`);
                await this.optimizeSlowQuery(queryKey, config, executionTime);
            }
            if (data && !error) {
                await performanceOptimizer.getCachedQuery(cacheKey, () => Promise.resolve(data), config.cacheDuration || 300000);
            }
            return { data, error, stats };
        }
        catch (error) {
            const executionTime = performance.now() - startTime;
            const stats = {
                executionTime,
                rowsReturned: 0,
                cacheHit: false,
                timestamp: Date.now()
            };
            this.recordQueryStats(queryKey, stats);
            console.error(`❌ Erro na query ${queryKey}:`, error);
            return { data: null, error, stats };
        }
    }
    static async applyOptimizedFilters(query, filters, table) {
        const availableIndexes = await this.getTableIndexes(table);
        const sortedFilters = Object.entries(filters).sort(([keyA], [keyB]) => {
            const aHasIndex = availableIndexes.some(idx => idx.includes(keyA));
            const bHasIndex = availableIndexes.some(idx => idx.includes(keyB));
            if (aHasIndex && !bHasIndex)
                return -1;
            if (!aHasIndex && bHasIndex)
                return 1;
            return 0;
        });
        for (const [key, value] of sortedFilters) {
            if (Array.isArray(value)) {
                query = query.in(key, value);
            }
            else if (typeof value === 'object' && value !== null) {
                if (value.gte !== undefined)
                    query = query.gte(key, value.gte);
                if (value.lte !== undefined)
                    query = query.lte(key, value.lte);
                if (value.like !== undefined)
                    query = query.like(key, value.like);
                if (value.ilike !== undefined)
                    query = query.ilike(key, value.ilike);
            }
            else {
                query = query.eq(key, value);
            }
        }
        return query;
    }
    static async getOptimizedSelect(table) {
        const commonSelections = {
            'users': 'id, nome, email, telefone, created_at',
            'agendamentos': 'id, cliente_id, servico_id, data_agendamento, status, valor, created_at',
            'servicos': 'id, nome, descricao, preco, duracao, ativo',
            'clientes': 'id, nome, email, telefone, data_nascimento, created_at',
            'financeiro': 'id, tipo, valor, descricao, data_transacao, categoria'
        };
        return commonSelections[table] || '*';
    }
    static async getTableIndexes(table) {
        if (this.indexCache.has(table)) {
            return this.indexCache.get(table);
        }
        try {
            const { data } = await supabase.rpc('get_table_indexes', { table_name: table });
            const indexes = data || [];
            this.indexCache.set(table, indexes);
            return indexes;
        }
        catch (error) {
            console.warn(`Não foi possível obter índices para ${table}:`, error);
            return [];
        }
    }
    static async optimizeSlowQuery(queryKey, config, executionTime) {
        console.log(`🔧 Otimizando query lenta: ${queryKey}`);
        if (config.filters) {
            const suggestedIndexes = Object.keys(config.filters);
            console.log(`💡 Sugestão: Criar índices para colunas: ${suggestedIndexes.join(', ')}`);
        }
        if (executionTime > 2000) {
            console.log(`💡 Sugestão: Aumentar duração do cache para ${queryKey}`);
        }
        const optimization = {
            queryKey,
            config,
            executionTime,
            timestamp: Date.now(),
            suggestions: this.generateOptimizationSuggestions(config, executionTime)
        };
        console.log('📊 Dados de otimização:', optimization);
    }
    static generateOptimizationSuggestions(config, executionTime) {
        const suggestions = [];
        if (executionTime > 2000) {
            suggestions.push('Considere aumentar a duração do cache');
        }
        if (config.filters && Object.keys(config.filters).length > 3) {
            suggestions.push('Muitos filtros - considere criar índices compostos');
        }
        if (!config.limit || config.limit > 100) {
            suggestions.push('Implemente paginação para melhor performance');
        }
        if (!config.select || config.select === '*') {
            suggestions.push('Especifique apenas as colunas necessárias');
        }
        return suggestions;
    }
    static recordQueryStats(queryKey, stats) {
        if (!this.queryStats.has(queryKey)) {
            this.queryStats.set(queryKey, []);
        }
        const queryHistory = this.queryStats.get(queryKey);
        queryHistory.push(stats);
        if (queryHistory.length > 100) {
            queryHistory.shift();
        }
    }
    static getTimeoutForPriority(priority) {
        const timeouts = {
            high: 2000,
            medium: 5000,
            low: 10000
        };
        return timeouts[priority];
    }
    static generateCacheKey(queryKey, config) {
        const configHash = JSON.stringify({
            table: config.table,
            select: config.select,
            filters: config.filters,
            orderBy: config.orderBy,
            limit: config.limit,
            offset: config.offset
        });
        return `query_${queryKey}_${btoa(configHash).slice(0, 16)}`;
    }
    static getPerformanceStats() {
        const stats = {};
        for (const [queryKey, history] of this.queryStats.entries()) {
            const recentStats = history.slice(-10);
            const avgTime = recentStats.reduce((sum, stat) => sum + stat.executionTime, 0) / recentStats.length;
            const cacheHitRate = recentStats.filter(stat => stat.cacheHit).length / recentStats.length;
            stats[queryKey] = {
                averageTime: avgTime,
                cacheHitRate,
                totalExecutions: history.length,
                lastExecution: history[history.length - 1]?.timestamp
            };
        }
        return stats;
    }
    static clearCache() {
        this.queryStats.clear();
        this.indexCache.clear();
        console.log('🧹 Cache do SupabaseOptimizer limpo');
    }
}
SupabaseOptimizer.queryStats = new Map();
SupabaseOptimizer.indexCache = new Map();
SupabaseOptimizer.slowQueryThreshold = 1000;
export const optimizedQuery = (queryKey, config) => {
    return SupabaseOptimizer.executeOptimizedQuery(queryKey, config);
};
export default SupabaseOptimizer;
