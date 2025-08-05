import { useAuth } from './useAuth'

/**
 * Hook para verificar permissões de administrador
 */
export const useAdmin = () => {
  const { user, isLoading } = useAuth()

  // Por enquanto, apenas a Carina (email específico) é admin
  // Futuramente pode usar o campo 'tipo' do banco de dados
  const isAdmin = user?.email === 'carina@ciliosclick.com' || user?.tipo === 'admin'

  return {
    isAdmin,
    loading: isLoading,
    user
  }
} 