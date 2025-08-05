import { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// Desabilitar parsing automático do body
export const config = {
  api: {
    bodyParser: false,
  },
}

// Função para ler o body bruto
function getRawBody(req: VercelRequest): Promise<string> {
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

// Função principal
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
    console.log('🚀 Debug Webhook endpoint')
    
    // Obter headers
    const signature = req.headers['x-hotmart-signature'] as string
    
    // Obter body bruto
    const rawBody = await getRawBody(req)
    
    // Verificar variáveis de ambiente
    const hotmartSecret = process.env.HOTMART_WEBHOOK_SECRET
    const viteHotmartSecret = process.env.VITE_HOTMART_WEBHOOK_SECRET
    
    console.log('🔍 Environment check:', {
      HOTMART_WEBHOOK_SECRET: hotmartSecret ? 'PRESENTE' : 'AUSENTE',
      VITE_HOTMART_WEBHOOK_SECRET: viteHotmartSecret ? 'PRESENTE' : 'AUSENTE',
      hotmartSecretValue: hotmartSecret,
      viteHotmartSecretValue: viteHotmartSecret
    })
    
    // Testar com ambos os segredos
    const results = []
    
    if (hotmartSecret) {
      const expectedSignature1 = crypto
        .createHmac('sha256', hotmartSecret)
        .update(rawBody, 'utf8')
        .digest('hex')
      
      results.push({
        secret: 'HOTMART_WEBHOOK_SECRET',
        value: hotmartSecret,
        expectedSignature: `sha256=${expectedSignature1}`,
        match: signature === `sha256=${expectedSignature1}`
      })
    }
    
    if (viteHotmartSecret) {
      const expectedSignature2 = crypto
        .createHmac('sha256', viteHotmartSecret)
        .update(rawBody, 'utf8')
        .digest('hex')
      
      results.push({
        secret: 'VITE_HOTMART_WEBHOOK_SECRET',
        value: viteHotmartSecret,
        expectedSignature: `sha256=${expectedSignature2}`,
        match: signature === `sha256=${expectedSignature2}`
      })
    }
    
    // Testar com "PRESENTE"
    const expectedSignature3 = crypto
      .createHmac('sha256', 'PRESENTE')
      .update(rawBody, 'utf8')
      .digest('hex')
    
    results.push({
      secret: 'HARDCODED_PRESENTE',
      value: 'PRESENTE',
      expectedSignature: `sha256=${expectedSignature3}`,
      match: signature === `sha256=${expectedSignature3}`
    })
    
    res.status(200).json({
      success: true,
      message: 'Debug webhook endpoint',
      rawBody: {
        length: rawBody.length,
        bytes: Buffer.byteLength(rawBody, 'utf8'),
        preview: rawBody.substring(0, 100)
      },
      signature: {
        received: signature
      },
      results: results,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message 
    })
  }
}