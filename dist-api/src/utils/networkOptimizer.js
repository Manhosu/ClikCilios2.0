const NETWORK_CONFIG = {
    maxRetries: 5,
    retryDelay: 1000,
    timeout: 15000,
    batchSize: 10,
    compressionThreshold: 1024
};
export class NetworkOptimizer {
    constructor() {
        this.requestQueue = new Map();
        this.connectionQuality = 'fast';
    }
    static getInstance() {
        if (!NetworkOptimizer.instance) {
            NetworkOptimizer.instance = new NetworkOptimizer();
            NetworkOptimizer.instance.initNetworkMonitoring();
        }
        return NetworkOptimizer.instance;
    }
    initNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const updateConnectionQuality = () => {
                const effectiveType = connection.effectiveType;
                if (effectiveType === '4g' || effectiveType === '3g') {
                    this.connectionQuality = 'fast';
                }
                else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                    this.connectionQuality = 'slow';
                }
                console.log(`📶 Qualidade de rede: ${this.connectionQuality} (${effectiveType})`);
            };
            connection.addEventListener('change', updateConnectionQuality);
            updateConnectionQuality();
        }
        window.addEventListener('online', () => {
            this.connectionQuality = 'fast';
            console.log('🌐 Conexão restaurada');
        });
        window.addEventListener('offline', () => {
            this.connectionQuality = 'offline';
            console.log('📵 Conexão perdida');
        });
    }
    async optimizedRequest(key, requestFn, options = {}) {
        const { retries = NETWORK_CONFIG.maxRetries, timeout = NETWORK_CONFIG.timeout, priority = 'normal' } = options;
        if (this.requestQueue.has(key)) {
            console.log(`🔄 Request deduplicated: ${key}`);
            return this.requestQueue.get(key);
        }
        const requestPromise = this.executeWithRetry(requestFn, retries, timeout, priority);
        this.requestQueue.set(key, requestPromise);
        try {
            const result = await requestPromise;
            return result;
        }
        finally {
            this.requestQueue.delete(key);
        }
    }
    async executeWithRetry(requestFn, retries, timeout, priority) {
        let lastError = new Error('Unknown error');
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const adjustedTimeout = this.getAdjustedTimeout(timeout, priority);
                const result = await Promise.race([
                    requestFn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), adjustedTimeout))
                ]);
                if (attempt > 0) {
                    console.log(`✅ Request succeeded after ${attempt} retries`);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (attempt < retries) {
                    const delay = this.getRetryDelay(attempt, priority);
                    console.log(`🔄 Retry ${attempt + 1}/${retries} in ${delay}ms: ${lastError.message}`);
                    await this.delay(delay);
                }
            }
        }
        console.error(`❌ Request failed after ${retries} retries:`, lastError);
        throw lastError;
    }
    getAdjustedTimeout(baseTimeout, priority) {
        let multiplier = 1;
        if (this.connectionQuality === 'slow') {
            multiplier *= 2;
        }
        else if (this.connectionQuality === 'offline') {
            multiplier *= 0.5;
        }
        if (priority === 'high') {
            multiplier *= 1.5;
        }
        else if (priority === 'low') {
            multiplier *= 0.7;
        }
        return Math.round(baseTimeout * multiplier);
    }
    getRetryDelay(attempt, priority) {
        const baseDelay = NETWORK_CONFIG.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        let multiplier = 1;
        if (priority === 'high') {
            multiplier = 0.5;
        }
        else if (priority === 'low') {
            multiplier = 2;
        }
        return Math.min(exponentialDelay * multiplier, 5000);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async batchRequests(requests, batchSize = NETWORK_CONFIG.batchSize) {
        const results = [];
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            const batchPromises = batch.map(({ key, fn }) => this.optimizedRequest(key, fn, { priority: 'normal' }));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error(`❌ Batch request failed: ${batch[index].key}`, result.reason);
                }
            });
            if (i + batchSize < requests.length) {
                await this.delay(100);
            }
        }
        return results;
    }
    optimizeSupabaseQuery(query) {
        return query
            .abortSignal(AbortSignal.timeout(this.getAdjustedTimeout(5000, 'high')));
    }
    getNetworkStatus() {
        return {
            quality: this.connectionQuality,
            isOnline: navigator.onLine,
            pendingRequests: this.requestQueue.size
        };
    }
}
export const networkOptimizer = NetworkOptimizer.getInstance();
