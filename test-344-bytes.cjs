const crypto = require('crypto');

// Segredo real
const HOTMART_WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Assinatura esperada pelo servidor
const expectedSignature = '6adf647b95b416545d2d3df27c4692547f4164377a9cf40832a508481aac81d8';

console.log('🔍 Tentando descobrir o corpo que gera 344 bytes...');

// Corpo original (343 bytes)
const originalBody = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"João Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}';

console.log('Original:', originalBody.length, 'chars,', Buffer.byteLength(originalBody, 'utf8'), 'bytes');

// Teste 1: Substituir 'ã' por caractere que ocupa 2 bytes UTF-8
const bodyWithDifferentA = originalBody.replace(/ã/g, 'â');
console.log('Com â:', bodyWithDifferentA.length, 'chars,', Buffer.byteLength(bodyWithDifferentA, 'utf8'), 'bytes');
const sigWithDifferentA = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyWithDifferentA, 'utf8').digest('hex');
console.log('Assinatura:', `sha256=${sigWithDifferentA}`, sigWithDifferentA === expectedSignature ? '✅' : '❌');

// Teste 2: Adicionar um caractere extra
const bodyWithExtra = originalBody + ' ';
console.log('Com espaço extra:', bodyWithExtra.length, 'chars,', Buffer.byteLength(bodyWithExtra, 'utf8'), 'bytes');
const sigWithExtra = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyWithExtra, 'utf8').digest('hex');
console.log('Assinatura:', `sha256=${sigWithExtra}`, sigWithExtra === expectedSignature ? '✅' : '❌');

// Teste 3: Substituir 'ã' por caractere que pode ser interpretado diferentemente
const bodyWithReplacedA = originalBody.replace(/ã/g, 'ã'); // Pode ser diferente dependendo da codificação
console.log('Com ã (reescrito):', bodyWithReplacedA.length, 'chars,', Buffer.byteLength(bodyWithReplacedA, 'utf8'), 'bytes');
const sigWithReplacedA = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyWithReplacedA, 'utf8').digest('hex');
console.log('Assinatura:', `sha256=${sigWithReplacedA}`, sigWithReplacedA === expectedSignature ? '✅' : '❌');

// Teste 4: Tentar com diferentes representações do 'ã'
const variations = [
  originalBody.replace(/ã/g, '\u00e3'), // Unicode escape
  originalBody.replace(/ã/g, String.fromCharCode(227)), // Char code
  originalBody.replace(/ã/g, Buffer.from([195, 163]).toString('utf8')), // UTF-8 bytes
];

variations.forEach((body, index) => {
  console.log(`Variação ${index + 1}:`, body.length, 'chars,', Buffer.byteLength(body, 'utf8'), 'bytes');
  const sig = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
  console.log('Assinatura:', `sha256=${sig}`, sig === expectedSignature ? '✅' : '❌');
});

// Teste 5: Tentar forçar 344 bytes adicionando um byte invisível
const bodyWith344Bytes = originalBody.replace(/ã/g, 'ã\u200B'); // Zero-width space
console.log('Com zero-width space:', bodyWith344Bytes.length, 'chars,', Buffer.byteLength(bodyWith344Bytes, 'utf8'), 'bytes');
const sigWith344 = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyWith344Bytes, 'utf8').digest('hex');
console.log('Assinatura:', `sha256=${sigWith344}`, sigWith344 === expectedSignature ? '✅' : '❌');

console.log('\n🎯 Objetivo: encontrar um corpo com 344 bytes que gere a assinatura:', expectedSignature);