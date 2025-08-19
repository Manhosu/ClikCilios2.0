import { useAuthContext } from './useAuthContext';
export const useAdmin = () => {
    const { user, isLoading } = useAuthContext();
    const isAdmin = user?.email === 'carina@ciliosclick.com' || user?.tipo === 'admin';
    return {
        isAdmin,
        loading: isLoading,
        user
    };
};
