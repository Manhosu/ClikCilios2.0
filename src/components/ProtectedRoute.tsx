import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthContext()
  const [forceRedirect, setForceRedirect] = useState(false)

  // Timeout anti-travamento - se loading durar mais que 10 segundos, força redirecionamento
  useEffect(() => {
    if (!isLoading) return

    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout na verificação de autenticação, redirecionando para login')
      setForceRedirect(true)
    }, 10000) // 10 segundos (maior que o timeout do loadUserProfile)

    return () => clearTimeout(timeout)
  }, [isLoading])

  // Forçar redirecionamento se timeout ocorreu
  if (forceRedirect) {
    return <Navigate to="/login" replace />
  }

  // Mostrar loading enquanto verifica autenticação (com timeout)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
          <p className="mt-2 text-sm text-gray-400">Se demorar muito, você será redirecionado automaticamente</p>
        </div>
      </div>
    )
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Renderizar conteúdo protegido se autenticado
  return <>{children}</>
}

export default ProtectedRoute