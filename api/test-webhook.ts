import { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🧪 Test webhook called')
  
  const bodyString = JSON.stringify(req.body)
  const signature = req.headers['x-hotmart-signature'] as string
  
  // Testar geração de assinatura
  const secret = process.env.HOTMART_WEBHOOK_SECRET || ''
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex')
  
  const receivedSignature = signature ? signature.replace('sha256=', '') : ''
  
  console.log('🔐 HMAC Test:', {
    bodyString,
    bodyLength: bodyString.length,
    signature,
    secret: secret ? 'PRESENTE' : 'AUSENTE',
    expectedSignature,
    receivedSignature,
    match: expectedSignature === receivedSignature
  })
  
  res.status(200).json({
    success: true,
    message: 'Test webhook funcionando',
    hmacTest: {
      bodyString,
      bodyLength: bodyString.length,
      signature,
      secret: secret ? 'PRESENTE' : 'AUSENTE',
      expectedSignature,
      receivedSignature,
      match: expectedSignature === receivedSignature
    },
    environment: {
      HOTMART_WEBHOOK_SECRET: process.env.HOTMART_WEBHOOK_SECRET ? 'PRESENTE' : 'AUSENTE',
      VITE_HOTMART_WEBHOOK_SECRET: process.env.VITE_HOTMART_WEBHOOK_SECRET ? 'PRESENTE' : 'AUSENTE'
    }
  })
}