import { HotmartService, HotmartWebhookData } from '../services/hotmartService'

/**
 * Simulador de webhook da Hotmart para desenvolvimento
 */
export class WebhookDev {

  /**
   * Simular compra aprovada com cupom
   */
  static async simularCompraComCupom(
    email: string = 'cliente@teste.com',
    nome: string = 'Cliente Teste',
    cupom: string = 'LANA20',
    valor: number = 397.00
  ): Promise<void> {
    const webhookData: HotmartWebhookData = {
      id: `test-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        purchase: {
          order_id: `ORDER-${Date.now()}`,
          order_date: Date.now(),
          status: 'APPROVED',
          buyer: {
            name: nome,
            email: email
          },
          offer: {
            code: 'CILIOS-CLICK',
            name: 'CíliosClick - Extensão de Cílios'
          },
          price: {
            value: valor,
            currency_code: 'BRL'
          },
          tracking: {
            coupon: cupom,
            source: cupom,
            utm_source: 'hotmart',
            utm_medium: 'affiliate',
            utm_campaign: 'cilios-extensao'
          },
          affiliations: [{
            affiliate: {
              name: 'Parceira Teste',
              email: 'parceira@teste.com'
            },
            source: cupom,
            coupon: cupom
          }]
        }
      }
    }

    console.log('🚀 Simulando webhook de compra:', {
      email,
      nome,
      cupom,
      valor
    })

    const resultado = await HotmartService.processarWebhook(webhookData)
    
    if (resultado.success) {
      console.log('✅ Compra processada com sucesso:', resultado)
    } else {
      console.error('❌ Erro no processamento:', resultado)
    }
  }

  /**
   * Simular compra sem cupom
   */
  static async simularCompraSemCupom(
    email: string = 'cliente2@teste.com',
    nome: string = 'Cliente Sem Cupom',
    valor: number = 397.00
  ): Promise<void> {
    const webhookData: HotmartWebhookData = {
      id: `test-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        purchase: {
          order_id: `ORDER-${Date.now()}`,
          order_date: Date.now(),
          status: 'APPROVED',
          buyer: {
            name: nome,
            email: email
          },
          offer: {
            code: 'CILIOS-CLICK',
            name: 'CíliosClick - Extensão de Cílios'
          },
          price: {
            value: valor,
            currency_code: 'BRL'
          }
        }
      }
    }

    console.log('🚀 Simulando webhook sem cupom:', {
      email,
      nome,
      valor
    })

    const resultado = await HotmartService.processarWebhook(webhookData)
    
    if (resultado.success) {
      console.log('✅ Compra processada com sucesso:', resultado)
    } else {
      console.error('❌ Erro no processamento:', resultado)
    }
  }

  /**
   * Simular cancelamento
   */
  static async simularCancelamento(
    email: string = 'cliente@teste.com',
    nome: string = 'Cliente Teste'
  ): Promise<void> {
    const webhookData: HotmartWebhookData = {
      id: `test-cancel-${Date.now()}`,
      event: 'PURCHASE_CANCELED',
      data: {
        purchase: {
          order_id: `ORDER-CANCEL-${Date.now()}`,
          order_date: Date.now(),
          status: 'CANCELED',
          buyer: {
            name: nome,
            email: email
          },
          offer: {
            code: 'CILIOS-CLICK',
            name: 'CíliosClick - Extensão de Cílios'
          },
          price: {
            value: 397.00,
            currency_code: 'BRL'
          }
        }
      }
    }

    console.log('🚫 Simulando cancelamento:', {
      email,
      nome
    })

    const resultado = await HotmartService.processarCancelamento(webhookData)
    
    if (resultado.success) {
      console.log('✅ Cancelamento processado:', resultado)
    } else {
      console.error('❌ Erro no cancelamento:', resultado)
    }
  }

  /**
   * Processar webhook genérico (para testes manuais)
   */
  static async processarWebhook(data: any): Promise<void> {
    console.log('🔄 Processando webhook personalizado:', data)
    
    try {
      if (!HotmartService.validarEstrutura(data)) {
        console.error('❌ Estrutura inválida')
        return
      }

      let resultado
      
      switch (data.event) {
        case 'PURCHASE_APPROVED':
        case 'PURCHASE_COMPLETE':
          resultado = await HotmartService.processarWebhook(data)
          break
        
        case 'PURCHASE_CANCELED':
        case 'PURCHASE_REFUNDED':
        case 'PURCHASE_CHARGEBACK':
          resultado = await HotmartService.processarCancelamento(data)
          break
        
        default:
          console.log(`ℹ️ Evento ${data.event} não processado`)
          return
      }

      if (resultado.success) {
        console.log('✅ Webhook processado:', resultado)
      } else {
        console.error('❌ Erro no webhook:', resultado)
      }

    } catch (error) {
      console.error('❌ Erro interno:', error)
    }
  }

  /**
   * Endpoint de desenvolvimento para webhook
   */
  static async handleWebhookDev(request: Request): Promise<Response> {
    try {
      // Simular validação HMAC em desenvolvimento
      console.log('🔧 Modo desenvolvimento - webhook recebido')
      
      const data = await request.json()
      await this.processarWebhook(data)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook processado em modo desenvolvimento'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('❌ Erro no endpoint dev:', error)
      
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

// Expor funções globalmente para console do browser
if (typeof window !== 'undefined') {
  (window as any).WebhookDev = WebhookDev
} 