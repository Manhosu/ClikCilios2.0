import { createContext, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { AuthState } from '../hooks/useAuth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (email: string, password: string, nome: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

// Valor padrão para evitar problemas de inicialização
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'Context não inicializado' }),
  logout: async () => {},
  register: async () => ({ success: false, error: 'Context não inicializado' }),
  resetPassword: async () => ({ success: false, error: 'Context não inicializado' })
}

// Criar o contexto
export const AuthContext = createContext<AuthContextType>(defaultAuthContext)

interface AuthProviderProps {
  children: ReactNode
}

// Componente AuthProvider
const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// Exportação padrão do componente
export default AuthProvider