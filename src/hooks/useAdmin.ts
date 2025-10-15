import { useAuthContext } from './useAuthContext'

/**
 * Hook para verificar permissões de administrador
 */
export const useAdmin = () => {
  const { user, isLoading } = useAuthContext()

  // Verifica se é admin pelo email ou pela flag is_admin
  const isAdmin = user?.email === 'carinaprange86@gmail.com' || user?.is_admin === true

  return {
    isAdmin,
    loading: isLoading,
    user
  }
}
