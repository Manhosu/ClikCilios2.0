import { lazy } from 'react';
import { performanceMonitor } from './performanceMonitor';
const preloadCache = new Map();
export class LazyLoader {
    static createLazyComponent(key, config) {
        if (this.componentCache.has(key)) {
            return this.componentCache.get(key);
        }
        const lazyComponent = lazy(async () => {
            const startTime = performance.now();
            try {
                let modulePromise = preloadCache.get(key);
                if (!modulePromise) {
                    modulePromise = config.importFn();
                    preloadCache.set(key, modulePromise);
                }
                const module = await modulePromise;
                const loadTime = performance.now() - startTime;
                performanceMonitor.recordOperationTime(`Lazy Load: ${key}`, loadTime);
                console.log(`🚀 Componente ${key} carregado em ${loadTime.toFixed(2)}ms`);
                return module;
            }
            catch (error) {
                console.error(`❌ Erro ao carregar componente ${key}:`, error);
                throw error;
            }
        });
        this.componentCache.set(key, lazyComponent);
        if (config.preload) {
            this.addToPreloadQueue(key, config);
        }
        return lazyComponent;
    }
    static async preloadComponent(key, importFn) {
        if (preloadCache.has(key)) {
            return;
        }
        const startTime = performance.now();
        try {
            const modulePromise = importFn();
            preloadCache.set(key, modulePromise);
            await modulePromise;
            const preloadTime = performance.now() - startTime;
            performanceMonitor.recordOperationTime(`Preload: ${key}`, preloadTime);
            console.log(`⚡ Componente ${key} pré-carregado em ${preloadTime.toFixed(2)}ms`);
        }
        catch (error) {
            console.error(`❌ Erro ao pré-carregar componente ${key}:`, error);
            preloadCache.delete(key);
        }
    }
    static addToPreloadQueue(key, config) {
        this.preloadQueue.push({ key, config });
        this.processPreloadQueue();
    }
    static async processPreloadQueue() {
        if (this.isPreloading || this.preloadQueue.length === 0) {
            return;
        }
        this.isPreloading = true;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        this.preloadQueue.sort((a, b) => {
            const aPriority = priorityOrder[a.config.priority || 'medium'];
            const bPriority = priorityOrder[b.config.priority || 'medium'];
            return aPriority - bPriority;
        });
        const batchSize = 3;
        while (this.preloadQueue.length > 0) {
            const batch = this.preloadQueue.splice(0, batchSize);
            await Promise.allSettled(batch.map(({ key, config }) => this.preloadComponent(key, config.importFn)));
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        this.isPreloading = false;
    }
    static preloadCriticalComponents(currentRoute) {
        const criticalComponents = this.getCriticalComponentsForRoute(currentRoute);
        criticalComponents.forEach(({ key, importFn }) => {
            this.preloadComponent(key, importFn);
        });
    }
    static getCriticalComponentsForRoute(route) {
        const routeMap = {
            '/': [
                { key: 'Dashboard', importFn: () => import('../pages/Dashboard') },
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
        };
        return routeMap[route] || [];
    }
    static clearCache() {
        this.componentCache.clear();
        preloadCache.clear();
        this.preloadQueue.length = 0;
        console.log('🧹 Cache de componentes limpo');
    }
    static getCacheStats() {
        return {
            cached: this.componentCache.size,
            preloaded: preloadCache.size,
            queued: this.preloadQueue.length
        };
    }
}
LazyLoader.componentCache = new Map();
LazyLoader.preloadQueue = [];
LazyLoader.isPreloading = false;
export const createLazyComponent = (key, importFn, options = {}) => {
    return LazyLoader.createLazyComponent(key, {
        importFn,
        ...options
    });
};
export const usePreloadOnHover = (componentKey, importFn) => {
    return {
        onMouseEnter: () => LazyLoader.preloadComponent(componentKey, importFn),
        onFocus: () => LazyLoader.preloadComponent(componentKey, importFn)
    };
};
export default LazyLoader;
