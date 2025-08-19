import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        console.warn('⚠️ useAuthContext usado fora do AuthProvider');
        return {
            user: null,
            isLoading: false,
            isAuthenticated: false,
            login: async () => ({ success: false, error: 'Context não disponível' }),
            logout: async () => { },
            register: async () => ({ success: false, error: 'Context não disponível' }),
            resetPassword: async () => ({ success: false, error: 'Context não disponível' })
        };
    }
    return context;
}
