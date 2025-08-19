import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { clientesService } from '../services/clientesService';
import { imageApiService } from '../services/imageApiService';
const DataContext = createContext(undefined);
export const DataProvider = ({ children }) => {
    const { user, isLoading: userLoading } = useAuthContext();
    const [totalClientes, setTotalClientes] = useState(0);
    const [totalImagens, setTotalImagens] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!userLoading && user?.id) {
            refreshData();
        }
        else if (!userLoading && !user?.id) {
            setLoading(false);
            setTotalClientes(0);
            setTotalImagens(0);
        }
    }, [user, userLoading]);
    const refreshData = async () => {
        try {
            setLoading(true);
            if (!user?.id) {
                setTotalClientes(0);
                setTotalImagens(0);
                return;
            }
            const [clientes, imagens] = await Promise.all([
                clientesService.listar(user.id),
                imageApiService.listar()
            ]);
            setTotalClientes(clientes.length);
            setTotalImagens(imagens.length);
        }
        catch (error) {
            console.error('Erro ao carregar dados:', error);
            setTotalClientes(0);
            setTotalImagens(0);
        }
        finally {
            setLoading(false);
        }
    };
    const incrementClientes = () => {
        setTotalClientes(prev => prev + 1);
    };
    const decrementClientes = () => {
        setTotalClientes(prev => Math.max(0, prev - 1));
    };
    const incrementImagens = () => {
        setTotalImagens(prev => prev + 1);
    };
    const decrementImagens = () => {
        setTotalImagens(prev => Math.max(0, prev - 1));
    };
    const value = {
        totalClientes,
        totalImagens,
        loading,
        refreshData,
        incrementClientes,
        decrementClientes,
        incrementImagens,
        decrementImagens
    };
    return (<DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>);
};
export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext deve ser usado dentro de um DataProvider');
    }
    return context;
};
