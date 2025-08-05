const crypto = require('crypto')

// Testar diferentes codificações
const bodyOriginal = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"João Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}'

// Corpo como recebido pelo endpoint (com caractere especial diferente)
const bodyReceived = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"Jo�o Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}'

const secret = 'PRESENTE'

console.log('=== ANÁLISE DE CODIFICAÇÃO ===')
console.log('Body original:')
console.log('  Length:', bodyOriginal.length)
console.log('  UTF-8 bytes:', Buffer.byteLength(bodyOriginal, 'utf8'))
console.log('  Char ã code:', bodyOriginal.charCodeAt(bodyOriginal.indexOf('ã')))

console.log('\nBody recebido:')
console.log('  Length:', bodyReceived.length)
console.log('  UTF-8 bytes:', Buffer.byteLength(bodyReceived, 'utf8'))
console.log('  Char � code:', bodyReceived.charCodeAt(bodyReceived.indexOf('�')))

// Gerar assinaturas
const sig1 = crypto.createHmac('sha256', secret).update(Buffer.from(bodyOriginal, 'utf8')).digest('hex')
const sig2 = crypto.createHmac('sha256', secret).update(Buffer.from(bodyReceived, 'utf8')).digest('hex')

console.log('\n=== ASSINATURAS ===')
console.log('Original (ã):', `sha256=${sig1}`)
console.log('Recebido (�):', `sha256=${sig2}`)
console.log('Esperado pelo endpoint:', 'sha256=f1bfa3786208dafb351b57e1db50fc10a41eb836f7f5bf5710c3aab8b0be1ec3')

// Testar com diferentes codificações
console.log('\n=== TESTE COM DIFERENTES CODIFICAÇÕES ===')
const encodings = ['utf8', 'latin1', 'ascii', 'binary']
encodings.forEach(encoding => {
  try {
    const sig = crypto.createHmac('sha256', secret).update(bodyReceived, encoding).digest('hex')
    console.log(`${encoding}:`, `sha256=${sig}`)
  } catch (e) {
    console.log(`${encoding}: ERRO -`, e.message)
  }
})