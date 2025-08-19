import { supabase } from '../lib/supabase';
const queryCache = {};
const CACHE_TTL = {
    user: 5 * 60 * 1000,
    static: 30 * 60 * 1000,
    dynamic: 1 * 60 * 1000
};
export class PerformanceOptimizer {
    constructor() {
        this.isPreloading = false;
    }
    static getInstance() {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }
    async getCachedQuery(key, queryFn, ttl = CACHE_TTL.dynamic) {
        const cached = queryCache[key];
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            console.log(`⚡ Cache hit para: ${key}`);
            return cached.data;
        }
        console.log(`🔄 Executando query: ${key}`);
        const data = await queryFn();
        queryCache[key] = {
            data,
            timestamp: Date.now(),
            ttl
        };
        return data;
    }
    async preloadCriticalData(userId) {
        if (this.isPreloading)
            return;
        this.isPreloading = true;
        console.log('🚀 Iniciando pré-carregamento de dados críticos');
        try {
            await this.getCachedQuery(`user_${userId}`, async () => {
                const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
                return { data, error };
            }, CACHE_TTL.user);
            await this.getCachedQuery('system_config', async () => {
                const { data, error } = await supabase.from('configuracoes').select('*');
                return { data, error };
            }, CACHE_TTL.static);
            console.log('✅ Pré-carregamento concluído');
        }
        catch (error) {
            console.warn('⚠️ Erro no pré-carregamento:', error);
        }
        finally {
            this.isPreloading = false;
        }
    }
    invalidateCache(pattern) {
        if (pattern) {
            Object.keys(queryCache).forEach(key => {
                if (key.includes(pattern)) {
                    delete queryCache[key];
                    console.log(`🗑️ Cache invalidado: ${key}`);
                }
            });
        }
        else {
            Object.keys(queryCache).forEach(key => delete queryCache[key]);
            console.log('🗑️ Todo cache invalidado');
        }
    }
    cleanExpiredCache() {
        const now = Date.now();
        Object.keys(queryCache).forEach(key => {
            const cached = queryCache[key];
            if (now - cached.timestamp > cached.ttl) {
                delete queryCache[key];
            }
        });
    }
    optimizeSupabaseQuery(query) {
        return query
            .limit(100)
            .order('created_at', { ascending: false });
    }
    measurePerformance(operation, fn) {
        const start = performance.now();
        return fn().then(result => {
            const duration = performance.now() - start;
            console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
            if (duration > 1000) {
                console.warn(`🐌 Operação lenta detectada: ${operation} (${duration.toFixed(2)}ms)`);
            }
            return result;
        });
    }
}
export const performanceOptimizer = PerformanceOptimizer.getInstance();
setInterval(() => {
    performanceOptimizer.cleanExpiredCache();
}, 60000);
