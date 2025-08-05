const crypto = require('crypto');

// Segredo real
const HOTMART_WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Corpo que estou enviando
const myBody = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"João Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}';

console.log('🔍 Analisando diferenças no corpo da requisição...');
console.log('\n📝 Corpo que estou enviando:');
console.log('Comprimento:', myBody.length);
console.log('Bytes UTF-8:', Buffer.byteLength(myBody, 'utf8'));
console.log('Preview:', myBody.substring(0, 100));

// Minha assinatura
const mySignature = crypto
  .createHmac('sha256', HOTMART_WEBHOOK_SECRET)
  .update(myBody, 'utf8')
  .digest('hex');

console.log('\n🔐 Minha assinatura:', `sha256=${mySignature}`);

// Assinatura esperada pelo servidor (do debug)
const expectedSignature = '6adf647b95b416545d2d3df27c4692547f4164377a9cf40832a508481aac81d8';
console.log('🎯 Assinatura esperada:', `sha256=${expectedSignature}`);
console.log('✅ Match:', mySignature === expectedSignature);

// Vamos tentar descobrir qual corpo gera a assinatura esperada
console.log('\n🔍 Testando variações do corpo...');

// Teste 1: Sem espaços após dois pontos
const bodyNoSpaces = myBody.replace(/: /g, ':');
const sigNoSpaces = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyNoSpaces, 'utf8').digest('hex');
console.log('Sem espaços após ":":', `sha256=${sigNoSpaces}`, sigNoSpaces === expectedSignature ? '✅' : '❌');

// Teste 2: Com caracteres especiais diferentes
const bodyDifferentChars = myBody.replace(/ã/g, 'a').replace(/ç/g, 'c');
const sigDifferentChars = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyDifferentChars, 'utf8').digest('hex');
console.log('Sem acentos:', `sha256=${sigDifferentChars}`, sigDifferentChars === expectedSignature ? '✅' : '❌');

// Teste 3: Minificado (sem espaços)
const bodyMinified = JSON.stringify(JSON.parse(myBody));
const sigMinified = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(bodyMinified, 'utf8').digest('hex');
console.log('JSON minificado:', `sha256=${sigMinified}`, sigMinified === expectedSignature ? '✅' : '❌');

// Teste 4: Com diferentes codificações
const encodings = ['utf8', 'latin1', 'ascii', 'binary'];
for (const encoding of encodings) {
  try {
    const sig = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(myBody, encoding).digest('hex');
    console.log(`Encoding ${encoding}:`, `sha256=${sig}`, sig === expectedSignature ? '✅' : '❌');
  } catch (e) {
    console.log(`Encoding ${encoding}: ERRO`);
  }
}

console.log('\n📊 Informações do servidor (do debug):');
console.log('- Comprimento recebido: 342');
console.log('- Bytes recebidos: 344');
console.log('- Meu comprimento:', myBody.length);
console.log('- Meus bytes:', Buffer.byteLength(myBody, 'utf8'));