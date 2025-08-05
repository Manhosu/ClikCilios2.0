import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// Desabilitar parsing automático do body
export const config = {
  api: {
    bodyParser: false,
  },
}

// Função para ler o body bruto
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const secret = process.env.HOTMART_WEBHOOK_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Secret não configurado' })
    }

    // Obter o raw body
    const rawBody = await getRawBody(req)
    const receivedSignature = req.headers['x-hotmart-signature'] as string

    // Gerar assinatura esperada com o raw body
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')

    const receivedWithoutPrefix = receivedSignature?.replace('sha256=', '') || ''

    // Também testar com Buffer.from
    const expectedSignatureBuffer = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex')

    return res.status(200).json({
      debug: {
        rawBody,
        rawBodyLength: rawBody.length,
        rawBodyBytes: Buffer.byteLength(rawBody, 'utf8'),
        rawBodyPreview: rawBody.substring(0, 100) + '...',
        receivedSignature,
        receivedWithoutPrefix,
        expectedSignature,
        expectedSignatureBuffer,
        secretPreview: `${secret.substring(0, 8)}...${secret.substring(secret.length - 8)}`,
        matchString: expectedSignature === receivedWithoutPrefix,
        matchBuffer: expectedSignatureBuffer === receivedWithoutPrefix,
        headers: req.headers
      }
    })

  } catch (error) {
    return res.status(500).json({ 
      error: 'Erro interno',
      details: (error as Error).message 
    })
  }
}