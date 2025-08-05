import React, { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { WebhookDev } from '../utils/webhookDev'
import { Button } from '../components/Button'

interface TesteWebhook {
  tipo: 'compra_com_cupom' | 'compra_sem_cupom' | 'cancelamento' | 'personalizado'
  email: string
  nome: string
  cupom?: string
  valor: number
  customData?: string
}

const AdminWebhookTestePage: React.FC = () => {
  const { isAdmin, loading } = useAdmin()
  const [teste, setTeste] = useState<TesteWebhook>({
    tipo: 'compra_com_cupom',
    email: 'cliente@teste.com',
    nome: 'Cliente Teste',
    cupom: 'LANA20',
    valor: 397.00
  })
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<string>('')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  const executarTeste = async () => {
    setProcessando(true)
    setResultado('')

    try {
      console.log('🧪 Executando teste de webhook:', teste)

      switch (teste.tipo) {
        case 'compra_com_cupom':
          await WebhookDev.simularCompraComCupom(
            teste.email,
            teste.nome,
            teste.cupom || 'LANA20',
            teste.valor
          )
          setResultado('✅ Compra com cupom simulada com sucesso! Verifique o console.')
          break

        case 'compra_sem_cupom':
          await WebhookDev.simularCompraSemCupom(
            teste.email,
            teste.nome,
            teste.valor
          )
          setResultado('✅ Compra sem cupom simulada com sucesso! Verifique o console.')
          break

        case 'cancelamento':
          await WebhookDev.simularCancelamento(teste.email, teste.nome)
          setResultado('✅ Cancelamento simulado com sucesso! Verifique o console.')
          break

        case 'personalizado':
          if (!teste.customData) {
            setResultado('❌ Dados personalizados obrigatórios')
            return
          }
          const data = JSON.parse(teste.customData)
          await WebhookDev.processarWebhook(data)
          setResultado('✅ Webhook personalizado processado! Verifique o console.')
          break
      }

    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setResultado(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Teste de Webhook Hotmart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Teste */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Configuração do Teste</h2>

              {/* Tipo de Teste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Teste
                </label>
                <select
                  value={teste.tipo}
                  onChange={(e) => setTeste(prev => ({ 
                    ...prev, 
                    tipo: e.target.value as TesteWebhook['tipo']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="compra_com_cupom">Compra com Cupom</option>
                  <option value="compra_sem_cupom">Compra sem Cupom</option>
                  <option value="cancelamento">Cancelamento</option>
                  <option value="personalizado">Webhook Personalizado</option>
                </select>
              </div>

              {teste.tipo !== 'personalizado' && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Cliente
                    </label>
                    <input
                      type="email"
                      value={teste.email}
                      onChange={(e) => setTeste(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="cliente@teste.com"
                    />
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={teste.nome}
                      onChange={(e) => setTeste(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Cliente Teste"
                    />
                  </div>

                  {/* Cupom (apenas para compra com cupom) */}
                  {teste.tipo === 'compra_com_cupom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código do Cupom
                      </label>
                      <input
                        type="text"
                        value={teste.cupom || ''}
                        onChange={(e) => setTeste(prev => ({ ...prev, cupom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="LANA20"
                      />
                    </div>
                  )}

                  {/* Valor (apenas para compras) */}
                  {(teste.tipo === 'compra_com_cupom' || teste.tipo === 'compra_sem_cupom') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da Compra (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={teste.valor}
                        onChange={(e) => setTeste(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="397.00"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Dados Personalizados */}
              {teste.tipo === 'personalizado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dados do Webhook (JSON)
                  </label>
                  <textarea
                    rows={10}
                    value={teste.customData || ''}
                    onChange={(e) => setTeste(prev => ({ ...prev, customData: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    placeholder={JSON.stringify({
                      id: "test-123",
                      event: "PURCHASE_APPROVED",
                      data: {
                        purchase: {
                          order_id: "ORDER-123",
                          order_date: Date.now(),
                          status: "APPROVED",
                          buyer: {
                            name: "Cliente Teste",
                            email: "cliente@teste.com"
                          },
                          offer: {
                            code: "CILIOS-CLICK",
                            name: "CíliosClick"
                          },
                          price: {
                            value: 397.00,
                            currency_code: "BRL"
                          },
                          tracking: {
                            coupon: "LANA20"
                          }
                        }
                      }
                    }, null, 2)}
                  />
                </div>
              )}

              {/* Botão de Teste */}
              <Button
                onClick={executarTeste}
                isLoading={processando}
                className="w-full"
              >
                {processando ? 'Executando Teste...' : 'Executar Teste'}
              </Button>
            </div>

            {/* Informações e Resultado */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  ℹ️ Como Funciona
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                  <ul className="space-y-2">
                    <li>• <strong>Compra com Cupom:</strong> Simula compra aprovada com cupom, criando usuário e registrando uso do cupom</li>
                    <li>• <strong>Compra sem Cupom:</strong> Simula compra aprovada sem cupom, apenas criando usuário</li>
                    <li>• <strong>Cancelamento:</strong> Simula cancelamento de compra</li>
                    <li>• <strong>Personalizado:</strong> Permite testar com dados específicos da Hotmart</li>
                  </ul>
                </div>
              </div>

              {/* Resultado */}
              {resultado && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Resultado</h3>
                  <div className={`p-4 rounded-lg ${
                    resultado.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {resultado}
                  </div>
                </div>
              )}

              {/* Console */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  📝 Console do Navegador
                </h3>
                <p className="text-sm text-gray-600">
                  Abra o console do navegador (F12) para ver logs detalhados do processamento do webhook.
                </p>
              </div>

              {/* Configurações */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  ⚙️ Configuração de Produção
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Endpoint:</strong> /api/hotmart-webhook</p>
                  <p><strong>Método:</strong> POST</p>
                  <p><strong>Header:</strong> X-Hotmart-Signature</p>
                  <p><strong>Variável:</strong> VITE_HOTMART_WEBHOOK_SECRET</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminWebhookTestePage 