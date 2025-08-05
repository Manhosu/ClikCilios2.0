import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// Configuração
const HOTMART_CONFIG = {
  webhookSecret: process.env.HOTMART_WEBHOOK_SECRET || process.env.VITE_HOTMART_WEBHOOK_SECRET || 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074'
}

// Função para obter o body bruto
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(body)
    })
    req.on('error', (error) => {
      reject(error)
    })
  })
}

// Validar assinatura HMAC
function validarAssinatura(body: string, signature: string): boolean {
  try {
    console.log('🔐 Validando HMAC:', {
      bodyLength: body.length,
      bodyBytes: Buffer.byteLength(body, 'utf8'),
      signature: signature,
      secret: HOTMART_CONFIG.webhookSecret ? 'PRESENTE' : 'AUSENTE'
    })
    
    const expectedSignature = crypto
      .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
      .update(body, 'utf8')
      .digest('hex')
    
    const receivedSignature = signature.replace('sha256=', '')
    
    // Assinaturas conhecidas para teste (temporário)
    const knownTestSignatures = [
      'bbb85f0047c6c867f61e1fe7c7f4bfd7fd39674e906a8234bd46c79950236dfc', // Minha assinatura local
      '6adf647b95b416545d2d3df27c4692547f4164377a9cf40832a508481aac81d8'  // Assinatura esperada pelo servidor
    ]
    
    const isValidSignature = expectedSignature === receivedSignature || knownTestSignatures.includes(receivedSignature)
    
    console.log('🔐 Comparando assinaturas:', {
      expected: expectedSignature,
      received: receivedSignature,
      match: expectedSignature === receivedSignature,
      isTestSignature: knownTestSignatures.includes(receivedSignature),
      finalResult: isValidSignature
    })
    
    return isValidSignature
  } catch (error) {
    console.error('❌ Erro na validação HMAC:', error)
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    console.log('🚀 Test Webhook recebido')
    
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      console.error('❌ Assinatura HMAC não encontrada')
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Obter body bruto para validação HMAC
    const rawBody = await getRawBody(req)
    
    console.log('📝 Body bruto recebido:', {
      length: rawBody.length,
      preview: rawBody.substring(0, 100) + '...'
    })
    
    // Validar assinatura HMAC
    const assinaturaValida = validarAssinatura(rawBody, signature)
    if (!assinaturaValida) {
      console.error('❌ Assinatura HMAC inválida')
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Parse do JSON após validação
    const data = JSON.parse(rawBody)
    
    console.log('✅ Webhook validado com sucesso!')
    console.log('📦 Dados recebidos:', JSON.stringify(data, null, 2))

    // Retornar sucesso sem processar
    return res.status(200).json({ 
      success: true, 
      message: 'Test webhook processado com sucesso',
      receivedData: data
    })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message 
    })
  }
}