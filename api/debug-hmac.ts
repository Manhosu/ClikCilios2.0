import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.HOTMART_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Secret não configurado' });
  }

  // Obter o body como string
  const bodyString = JSON.stringify(req.body);
  const receivedSignature = req.headers['x-hotmart-signature'] as string;

  // Gerar assinatura esperada
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString, 'utf8')
    .digest('hex');

  const expectedWithPrefix = `sha256=${expectedSignature}`;
  const receivedWithoutPrefix = receivedSignature?.replace('sha256=', '') || '';

  return res.status(200).json({
    debug: {
      bodyString,
      bodyLength: bodyString.length,
      bodyBytes: Buffer.byteLength(bodyString, 'utf8'),
      receivedSignature,
      receivedWithoutPrefix,
      expectedSignature,
      expectedWithPrefix,
      secretPreview: `${secret.substring(0, 8)}...${secret.substring(secret.length - 8)}`,
      match: expectedSignature === receivedWithoutPrefix,
      headers: req.headers
    }
  });
}