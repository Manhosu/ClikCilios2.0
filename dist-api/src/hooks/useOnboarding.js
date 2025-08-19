import { useState, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import { supabase } from '../lib/supabase';
export const useOnboarding = () => {
    const { user } = useAuthContext();
    const [onboarding, setOnboarding] = useState({
        isFirstLogin: false,
        showWelcome: false,
        currentStep: 0,
        steps: [],
        completed: false
    });
    const [loading, setLoading] = useState(true);
    const defaultSteps = [
        {
            id: 'welcome',
            title: 'Boas-vindas à CíliosClick! 🎉',
            description: 'Sua ferramenta profissional para mostrar como os cílios ficarão nas suas clientes',
            completed: false
        },
        {
            id: 'first-upload',
            title: 'Faça seu primeiro teste',
            description: 'Vamos começar aplicando cílios em uma foto',
            completed: false,
            action: 'Aplicar Cílios',
            url: '/aplicar-cilios'
        },
        {
            id: 'choose-style',
            title: 'Explore os estilos',
            description: 'Teste os 6 estilos profissionais disponíveis',
            completed: false
        },
        {
            id: 'download-result',
            title: 'Baixe o resultado',
            description: 'Salve a imagem para mostrar ou enviar à sua cliente',
            completed: false
        },
        {
            id: 'complete',
            title: 'Pronta para atender! ✨',
            description: 'Agora você pode usar a CíliosClick com suas clientes',
            completed: false
        }
    ];
    useEffect(() => {
        const checkFirstLogin = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('onboarding_completed, created_at')
                    .eq('id', user.id)
                    .single();
                if (error) {
                    console.log('⚠️ Tabela users não disponível, usando dados do Auth para onboarding');
                    const needsOnboarding = !user.onboarding_completed;
                    setOnboarding({
                        isFirstLogin: needsOnboarding,
                        showWelcome: needsOnboarding,
                        currentStep: 0,
                        steps: defaultSteps,
                        completed: user.onboarding_completed || false
                    });
                    setLoading(false);
                    return;
                }
                const isNewUser = userData && new Date().getTime() - new Date(userData.created_at).getTime() < 24 * 60 * 60 * 1000;
                const needsOnboarding = !userData?.onboarding_completed && isNewUser;
                setOnboarding({
                    isFirstLogin: needsOnboarding || false,
                    showWelcome: needsOnboarding || false,
                    currentStep: 0,
                    steps: defaultSteps,
                    completed: userData?.onboarding_completed || false
                });
            }
            catch (error) {
                console.error('Erro ao verificar primeiro login:', error);
                setOnboarding({
                    isFirstLogin: true,
                    showWelcome: true,
                    currentStep: 0,
                    steps: defaultSteps,
                    completed: false
                });
            }
            finally {
                setLoading(false);
            }
        };
        checkFirstLogin();
    }, [user]);
    const nextStep = () => {
        setOnboarding(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, prev.steps.length - 1)
        }));
    };
    const previousStep = () => {
        setOnboarding(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 0)
        }));
    };
    const completeStep = (stepId) => {
        setOnboarding(prev => ({
            ...prev,
            steps: prev.steps.map(step => step.id === stepId ? { ...step, completed: true } : step)
        }));
    };
    const skipOnboarding = async () => {
        if (!user)
            return;
        try {
            await supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            setOnboarding(prev => ({
                ...prev,
                showWelcome: false,
                completed: true
            }));
        }
        catch (error) {
            console.error('Erro ao pular onboarding:', error);
            setOnboarding(prev => ({
                ...prev,
                showWelcome: false,
                completed: true
            }));
        }
    };
    const completeOnboarding = async () => {
        if (!user)
            return;
        try {
            await supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            setOnboarding(prev => ({
                ...prev,
                showWelcome: false,
                completed: true,
                steps: prev.steps.map(step => ({ ...step, completed: true }))
            }));
        }
        catch (error) {
            console.error('Erro ao finalizar onboarding:', error);
            setOnboarding(prev => ({
                ...prev,
                showWelcome: false,
                completed: true,
                steps: prev.steps.map(step => ({ ...step, completed: true }))
            }));
        }
    };
    const closeWelcome = () => {
        setOnboarding(prev => ({
            ...prev,
            showWelcome: false
        }));
    };
    const showWelcomeAgain = () => {
        setOnboarding(prev => ({
            ...prev,
            showWelcome: true,
            currentStep: 0
        }));
    };
    const resetOnboarding = async () => {
        if (!user)
            return;
        try {
            await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', user.id);
            setOnboarding({
                isFirstLogin: true,
                showWelcome: true,
                currentStep: 0,
                steps: defaultSteps,
                completed: false
            });
        }
        catch (error) {
            console.error('Erro ao resetar onboarding:', error);
        }
    };
    return {
        ...onboarding,
        loading,
        nextStep,
        previousStep,
        completeStep,
        skipOnboarding,
        completeOnboarding,
        closeWelcome,
        showWelcomeAgain,
        resetOnboarding
    };
};
