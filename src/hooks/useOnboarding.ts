import { useState, useEffect } from 'react'
import { useAuthContext } from './useAuthContext'
import { supabase } from '../lib/supabase'

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  action?: string
  url?: string
}

interface OnboardingState {
  isFirstLogin: boolean
  showWelcome: boolean
  currentStep: number
  steps: OnboardingStep[]
  completed: boolean
}

/**
 * Hook para gerenciar o onboarding/boas-vindas da usuária
 */
export const useOnboarding = () => {
  const { user } = useAuthContext()
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    isFirstLogin: false,
    showWelcome: false,
    currentStep: 0,
    steps: [],
    completed: false
  })

  const [loading, setLoading] = useState(true)

  // Passos do onboarding
  const defaultSteps: OnboardingStep[] = [
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
  ]

  // Verificar se é o primeiro login
  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {


        // Verificar na tabela users se já fez onboarding
        const { data: userData, error } = await supabase
          .from('users')
          .select('onboarding_completed, created_at')
          .eq('id', user.id)
          .single()

        if (error) {
          console.log('⚠️ Tabela users não disponível, usando dados do Auth para onboarding')
          // Se não conseguir acessar a tabela, usar dados do usuário atual
          const needsOnboarding = !user.onboarding_completed
          
          setOnboarding({
            isFirstLogin: needsOnboarding,
            showWelcome: needsOnboarding,
            currentStep: 0,
            steps: defaultSteps,
            completed: user.onboarding_completed || false
          })
          setLoading(false)
          return
        }

        // Verificar se o usuário foi criado recentemente (últimas 24h)
        const isNewUser = userData && new Date().getTime() - new Date(userData.created_at).getTime() < 24 * 60 * 60 * 1000

        // Verificar se já completou o onboarding
        const needsOnboarding = !userData?.onboarding_completed && isNewUser

        setOnboarding({
          isFirstLogin: needsOnboarding || false,
          showWelcome: needsOnboarding || false,
          currentStep: 0,
          steps: defaultSteps,
          completed: userData?.onboarding_completed || false
        })

      } catch (error) {
        console.error('Erro ao verificar primeiro login:', error)
        // Em caso de erro, mostrar onboarding por segurança
        setOnboarding({
          isFirstLogin: true,
          showWelcome: true,
          currentStep: 0,
          steps: defaultSteps,
          completed: false
        })
      } finally {
        setLoading(false)
      }
    }

    checkFirstLogin()
  }, [user])

  // Avançar para próximo passo
  const nextStep = () => {
    setOnboarding(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.steps.length - 1)
    }))
  }

  // Voltar passo anterior
  const previousStep = () => {
    setOnboarding(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }))
  }

  // Marcar passo como concluído
  const completeStep = (stepId: string) => {
    setOnboarding(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    }))
  }

  // Pular onboarding
  const skipOnboarding = async () => {
    if (!user) return

    try {


      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      setOnboarding(prev => ({
        ...prev,
        showWelcome: false,
        completed: true
      }))
    } catch (error) {
      console.error('Erro ao pular onboarding:', error)
      // Mesmo com erro, fechar o modal
      setOnboarding(prev => ({
        ...prev,
        showWelcome: false,
        completed: true
      }))
    }
  }

  // Finalizar onboarding
  const completeOnboarding = async () => {
    if (!user) return

    try {


      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      setOnboarding(prev => ({
        ...prev,
        showWelcome: false,
        completed: true,
        steps: prev.steps.map(step => ({ ...step, completed: true }))
      }))
    } catch (error) {
      console.error('Erro ao finalizar onboarding:', error)
      // Mesmo com erro, fechar o modal
      setOnboarding(prev => ({
        ...prev,
        showWelcome: false,
        completed: true,
        steps: prev.steps.map(step => ({ ...step, completed: true }))
      }))
    }
  }

  // Fechar welcome screen
  const closeWelcome = () => {
    setOnboarding(prev => ({
      ...prev,
      showWelcome: false
    }))
  }

  // Reabrir welcome (para admins testarem)
  const showWelcomeAgain = () => {
    setOnboarding(prev => ({
      ...prev,
      showWelcome: true,
      currentStep: 0
    }))
  }

  // Resetar onboarding
  const resetOnboarding = async () => {
    if (!user) return

    try {
      await supabase
        .from('users')
        .update({ onboarding_completed: false })
        .eq('id', user.id)

      setOnboarding({
        isFirstLogin: true,
        showWelcome: true,
        currentStep: 0,
        steps: defaultSteps,
        completed: false
      })
    } catch (error) {
      console.error('Erro ao resetar onboarding:', error)
    }
  }

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
  }
}