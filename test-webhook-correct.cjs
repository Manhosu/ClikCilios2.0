const crypto = require('crypto')

// Corpo exato recebido pelo endpoint (com caractere especial codificado)
const body = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"João Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}'

// Segredo
const secret = 'PRESENTE'

// Verificar comprimento
console.log('String length:', body.length)
console.log('UTF-8 bytes:', Buffer.byteLength(body, 'utf8'))

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', secret)
  .update(Buffer.from(body, 'utf8'))
  .digest('hex')

console.log('Generated signature:', `sha256=${signature}`)

// Comando curl para teste
console.log('\nComando curl para teste:')
console.log(`curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook-raw \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "X-Hotmart-Signature: sha256=${signature}" \\`)
console.log(`  -d '${body}'`)