import { VercelRequest, VercelResponse } from '@vercel/node'

// Função para processar webhook da Hotmart (Vercel Serverless)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hotmart-Signature')

  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    console.log('🚀 Webhook Hotmart recebido')
    
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      console.error('❌ Assinatura HMAC não encontrada')
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Obter body como string para validação HMAC
    const body = JSON.stringify(req.body)
    
    // Importar e usar o serviço Hotmart
    const { HotmartService } = await import('../src/services/hotmartService')
    
    // Validar assinatura HMAC
    const assinaturaValida = await HotmartService.validarAssinatura(body, signature)
    if (!assinaturaValida) {
      console.error('❌ Assinatura HMAC inválida')
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Validar estrutura dos dados
    if (!HotmartService.validarEstrutura(req.body)) {
      console.error('❌ Estrutura de dados inválida:', req.body)
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    console.log('✅ Webhook validado, processando...')

    // Processar webhook baseado no evento
    let resultado
    const evento = req.body.event

    switch (evento) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        resultado = await HotmartService.processarWebhook(req.body)
        break
      
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        resultado = await HotmartService.processarCancelamento(req.body)
        break
      
      default:
        console.log(`ℹ️ Evento ${evento} ignorado`)
        return res.status(200).json({ 
          message: `Evento ${evento} recebido mas não processado` 
        })
    }

    if (resultado.success) {
      console.log('✅ Webhook processado com sucesso:', resultado)
      return res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.data
      })
    } else {
      console.error('❌ Erro no processamento:', resultado)
      return res.status(400).json({
        success: false,
        message: resultado.message,
        error: resultado.error
      })
    }

  } catch (error) {
    console.error('❌ Erro interno no webhook:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
} 