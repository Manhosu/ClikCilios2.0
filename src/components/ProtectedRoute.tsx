import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  console.log('🛡️ ProtectedRoute:', { isAuthenticated, isLoading })

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Verificando autenticação...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: Usuário não autenticado, redirecionando para login')
    return <Navigate to="/login" replace />
  }

  console.log('✅ ProtectedRoute: Usuário autenticado, renderizando conteúdo')
  // Renderizar conteúdo protegido se autenticado
  return <>{children}</>
}

export default ProtectedRoute 