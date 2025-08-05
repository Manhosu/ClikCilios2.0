const crypto = require('crypto');

// Dados de teste do webhook - exatamente como será enviado
const webhookData = {
  "id": "test-123",
  "event": "PURCHASE_APPROVED",
  "data": {
    "purchase": {
      "order_id": "ORDER-123",
      "order_date": 1641024000000,
      "status": "APPROVED",
      "buyer": {
        "name": "João Silva",
        "email": "joao@teste.com"
      },
      "offer": {
        "code": "OFFER-123",
        "name": "Produto Teste"
      },
      "price": {
        "value": 97,
        "currency_code": "BRL"
      },
      "tracking": {
        "coupon": "DESCONTO10",
        "source": "facebook"
      }
    }
  }
};

// Converter para string JSON sem espaços
const body = JSON.stringify(webhookData);

// Secret do webhook
const webhookSecret = 'PRESENTE';

console.log('Body info:');
console.log('- String length:', body.length);
console.log('- UTF-8 bytes:', Buffer.byteLength(body, 'utf8'));
console.log('- Body:', body);
console.log('');

// Gerar assinatura HMAC usando Buffer para garantir UTF-8
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(Buffer.from(body, 'utf8'))
  .digest('hex');

console.log('Signature:', `sha256=${signature}`);
console.log('');
console.log('Para testar o webhook RAW, use:');
console.log(`curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook-raw \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "X-Hotmart-Signature: sha256=${signature}" \\`);
console.log(`  -d '${body}'`);