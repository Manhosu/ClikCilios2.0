import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthContext();
    if (isLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    return <>{children}</>;
};
export default ProtectedRoute;
