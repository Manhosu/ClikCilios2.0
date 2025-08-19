export const HOTMART_CONFIG = {
    API_BASE_URL: 'https://api-sec-vlc.hotmart.com',
    WEBHOOK_ENDPOINT: '/api/webhook-hotmart',
    PROCESSED_EVENTS: [
        'PURCHASE_APPROVED',
        'PURCHASE_COMPLETE',
        'PURCHASE_CANCELLED',
        'PURCHASE_REFUNDED',
        'PURCHASE_CHARGEBACK'
    ],
    WEBHOOK_TIMEOUT: 30000,
    MAX_RETRY_ATTEMPTS: 3,
    DEFAULT_USER_PREFIX: 'user',
    MIN_AVAILABLE_USERS: 5,
    PASSWORD_LENGTH: 12,
    PASSWORD_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
    EMAIL_TEMPLATES: {
        WELCOME: {
            subject: '🎉 Bem-vinda ao CíliosClick! Seus dados de acesso',
            from: 'noreply@ciliosclick.com'
        },
        PASSWORD_RESET: {
            subject: '🔑 Nova senha de acesso - CíliosClick',
            from: 'noreply@ciliosclick.com'
        }
    },
    SYSTEM_URLS: {
        LOGIN: process.env.NODE_ENV === 'production'
            ? 'https://clik-cilios2-0.vercel.app/login'
            : 'http://localhost:5173/login',
        DASHBOARD: process.env.NODE_ENV === 'production'
            ? 'https://clik-cilios2-0.vercel.app/dashboard'
            : 'http://localhost:5173/dashboard'
    }
};
export const validateHotmartConfig = () => {
    const requiredEnvVars = [
        'VITE_HOTMART_CLIENT_ID',
        'VITE_HOTMART_CLIENT_SECRET',
        'VITE_HOTMART_BASIC_TOKEN'
    ];
    const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
    if (missing.length > 0) {
        console.warn('⚠️ Variáveis de ambiente Hotmart não configuradas:', missing);
        return false;
    }
    return true;
};
export const getHotmartCredentials = () => {
    return {
        clientId: import.meta.env.VITE_HOTMART_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_HOTMART_CLIENT_SECRET || '',
        basicToken: import.meta.env.VITE_HOTMART_BASIC_TOKEN || ''
    };
};
export const isHotmartEnabled = () => {
    return validateHotmartConfig() && import.meta.env.VITE_HOTMART_ENABLED === 'true';
};
if (import.meta.env.DEV) {
    console.log('🔗 Configuração Hotmart:', {
        enabled: isHotmartEnabled(),
        webhookEndpoint: HOTMART_CONFIG.WEBHOOK_ENDPOINT,
        systemUrls: HOTMART_CONFIG.SYSTEM_URLS,
        hasCredentials: validateHotmartConfig()
    });
}
