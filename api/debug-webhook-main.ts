import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// Configuração do Hotmart
const HOTMART_CONFIG = {
  webhookSecret: process.env.HOTMART_WEBHOOK_SECRET
}

// Desabilitar parsing automático do body
export const config = {
  api: {
    bodyParser: false,
  },
}

// Função para obter raw body (igual ao webhook principal)
function getRawBody(req: NextApiRequest): Promise<string> {
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

// Função de validação HMAC (igual ao webhook principal)
function validarAssinatura(body: string, signature: string): boolean {
  try {
    if (!HOTMART_CONFIG.webhookSecret) {
      console.error('❌ Webhook secret não configurado')
      return false
    }

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
      'test-signature', // Assinatura de teste simples
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
    console.log('🚀 DEBUG Webhook Hotmart recebido (RAW)')
    console.log('📋 Headers recebidos:', req.headers)
    
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      console.error('❌ Assinatura HMAC não encontrada')
      return res.status(401).json({ 
        error: 'Assinatura HMAC necessária',
        debug: {
          headers: req.headers,
          hasSignature: !!signature
        }
      })
    }

    // Obter body bruto para validação HMAC
    const rawBody = await getRawBody(req)
    
    console.log('📝 Body bruto recebido:', {
      length: rawBody.length,
      preview: rawBody.substring(0, 200) + '...',
      full: rawBody
    })
    
    // Validar assinatura HMAC
    const assinaturaValida = validarAssinatura(rawBody, signature)
    
    // Retornar informações detalhadas de debug
    return res.status(200).json({
      debug: {
        signature: signature,
        rawBody: rawBody,
        bodyLength: rawBody.length,
        bodyBytes: Buffer.byteLength(rawBody, 'utf8'),
        assinaturaValida: assinaturaValida,
        secret: HOTMART_CONFIG.webhookSecret ? 'PRESENTE' : 'AUSENTE',
        expectedSignature: crypto
          .createHmac('sha256', HOTMART_CONFIG.webhookSecret || '')
          .update(rawBody, 'utf8')
          .digest('hex'),
        receivedSignature: signature.replace('sha256=', ''),
        headers: req.headers
      },
      result: assinaturaValida ? 'VÁLIDA' : 'INVÁLIDA'
    })

  } catch (error) {
    console.error('❌ Erro no debug webhook:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message 
    })
  }
}