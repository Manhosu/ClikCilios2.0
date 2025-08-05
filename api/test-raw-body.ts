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
    console.log('🚀 Test RAW Body endpoint')
    
    // Obter headers
    const signature = req.headers['x-hotmart-signature'] as string
    
    // Obter body bruto
    const rawBody = await getRawBody(req)
    
    console.log('📝 Raw body info:', {
      length: rawBody.length,
      bytes: Buffer.byteLength(rawBody, 'utf8'),
      signature: signature,
      preview: rawBody.substring(0, 100)
    })
    
    // Gerar assinatura com o segredo "PRESENTE"
    const secret = 'PRESENTE'
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex')
    
    const receivedSignature = signature ? signature.replace('sha256=', '') : ''
    
    console.log('🔐 HMAC comparison:', {
      expected: expectedSignature,
      received: receivedSignature,
      match: expectedSignature === receivedSignature
    })
    
    res.status(200).json({
      success: true,
      message: 'Test RAW body endpoint',
      rawBody: {
        length: rawBody.length,
        bytes: Buffer.byteLength(rawBody, 'utf8'),
        content: rawBody
      },
      signature: {
        received: signature,
        expected: `sha256=${expectedSignature}`,
        match: expectedSignature === receivedSignature
      },
      environment: {
        HOTMART_WEBHOOK_SECRET: process.env.HOTMART_WEBHOOK_SECRET ? 'PRESENTE' : 'AUSENTE'
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