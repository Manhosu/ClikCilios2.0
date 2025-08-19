import { createContext } from 'react';
import { useAuth } from '../hooks/useAuth';
const defaultAuthContext = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => ({ success: false, error: 'Context não inicializado' }),
    logout: async () => { },
    register: async () => ({ success: false, error: 'Context não inicializado' }),
    resetPassword: async () => ({ success: false, error: 'Context não inicializado' })
};
export const AuthContext = createContext(defaultAuthContext);
const AuthProvider = ({ children }) => {
    const auth = useAuth();
    return (<AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>);
};
export default AuthProvider;
