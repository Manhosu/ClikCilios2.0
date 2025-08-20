// Configurações da API
export const API_CONFIG = {
  // URL base da API (para desenvolvimento local)
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://clik-cilios2-0.vercel.app'
    : 'http://localhost:3005',
  
  // Endpoints da API
  ENDPOINTS: {
    SAVE_IMAGE: '/api/save-client-image',
    LIST_IMAGES: '/api/list-images',
    DELETE_IMAGE: '/api/delete-image',
    DELETE_IMAGES: '/api/delete-images'
  },
  
  // Configurações de timeout
  TIMEOUT: 30000, // 30 segundos
  
  // Configurações de retry
  MAX_RETRY_ATTEMPTS: 3
};

// Exporta a URL base para compatibilidade
export const API_BASE_URL = API_CONFIG.BASE_URL;