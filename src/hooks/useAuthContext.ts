import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

// Hook separado para melhor compatibilidade com Fast Refresh
export function useAuthContext() {
  const context = useContext(AuthContext)
  
  // Verificação robusta
  if (!context) {
    console.warn('⚠️ useAuthContext usado fora do AuthProvider')
    // Retorna valores seguros ao invés de quebrar
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => ({ success: false, error: 'Context não disponível' }),
      logout: async () => {},
      register: async () => ({ success: false, error: 'Context não disponível' }),
      resetPassword: async () => ({ success: false, error: 'Context não disponível' })
    }
  }
  
  return context
} 