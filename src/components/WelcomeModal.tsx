import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../hooks/useOnboarding'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'

const WelcomeModal: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    showWelcome,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    closeWelcome
  } = useOnboarding()

  if (!showWelcome || steps.length === 0) {
    return null
  }

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      nextStep()
    }
  }

  const handleActionClick = () => {
    if (currentStepData.url) {
      closeWelcome()
      navigate(currentStepData.url)
    }
  }

  const firstName = (user as any)?.user_metadata?.name?.split(' ')[0] || 'Profissional'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isFirstStep ? `Olá, ${firstName}! 👋` : currentStepData.title}
              </h1>
              <p className="text-primary-100 text-lg">
                {isFirstStep 
                  ? 'Seja bem-vinda à CíliosClick!' 
                  : currentStepData.description
                }
              </p>
            </div>
            <button
              onClick={skipOnboarding}
              className="text-primary-200 hover:text-white transition-colors"
              title="Pular apresentação"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <span className="text-sm font-medium text-primary-600">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {isFirstStep ? (
            // Tela de boas-vindas principal
            <div className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bem-vinda à CíliosClick!
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Sua nova ferramenta profissional para mostrar às suas clientes como os cílios ficarão, 
                com realismo e qualidade profissional.
              </p>
              
              <div className="bg-primary-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">✨ O que você pode fazer:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-primary-600 text-xl">📷</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Upload de Fotos</h4>
                      <p className="text-sm text-gray-600">Envie fotos das suas clientes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary-600 text-xl">✨</span>
                    <div>
                      <h4 className="font-medium text-gray-900">6 Estilos Profissionais</h4>
                      <p className="text-sm text-gray-600">Volume Russo, Brasileiro, Egípcio e mais</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary-600 text-xl">🎯</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Resultado Realista</h4>
                      <p className="text-sm text-gray-600">Visualização com IA avançada</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary-600 text-xl">💾</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Download Fácil</h4>
                      <p className="text-sm text-gray-600">Salve e compartilhe os resultados</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Passos do tutorial
            <div className="text-center">
              <div className="text-4xl mb-4">
                {currentStepData.id === 'first-upload' && '📷'}
                {currentStepData.id === 'choose-style' && '✨'}
                {currentStepData.id === 'download-result' && '💾'}
                {currentStepData.id === 'complete' && '🎯'}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentStepData.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              {currentStepData.id === 'first-upload' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">💡</span>
                    <div className="text-left">
                      <h4 className="font-medium text-yellow-800 mb-1">Dica Profissional:</h4>
                      <p className="text-sm text-yellow-700">
                        Use fotos com boa iluminação, olhos bem abertos e sem maquiagem pesada nos cílios 
                        para obter os melhores resultados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.id === 'choose-style' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {[
                    'Volume Fio a Fio D',
                    'Volume Brasileiro D',
                    'Volume Egípcio 3D D',
                    'Volume Russo D',
                    'Boneca',
                    'Fox Eyes'
                  ].map((style) => (
                    <div key={style} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-900">{style}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentStepData.id === 'complete' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-green-800 mb-3">🎉 Parabéns!</h4>
                  <p className="text-green-700 mb-4">
                    Agora você está pronta para oferecer uma experiência incrível às suas clientes!
                  </p>
                  <div className="text-left">
                    <h5 className="font-medium text-green-800 mb-2">Próximos passos:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Teste com fotos reais das suas clientes</li>
                      <li>• Mostre os diferentes estilos disponíveis</li>
                      <li>• Use as imagens para fechar mais vendas</li>
                      <li>• Surpreenda com o atendimento profissional</li>
                    </ul>
                  </div>
                </div>
              )}

              {currentStepData.action && (
                <Button
                  onClick={handleActionClick}
                  variant="primary"
                  className="mb-4"
                >
                  {currentStepData.action}
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              onClick={previousStep}
              variant="secondary"
              disabled={isFirstStep}
              className={isFirstStep ? 'invisible' : ''}
            >
              ← Anterior
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={skipOnboarding}
                variant="secondary"
                className="text-gray-600"
              >
                Pular Tour
              </Button>
              
              <Button
                onClick={handleNext}
                variant="primary"
              >
                {isLastStep ? 'Começar a Usar!' : 'Próximo →'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal 