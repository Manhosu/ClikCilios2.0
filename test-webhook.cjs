const crypto = require('crypto');

// Dados de teste do webhook
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
        "value": 97.00,
        "currency_code": "BRL"
      },
      "tracking": {
        "coupon": "DESCONTO10",
        "source": "facebook"
      }
    }
  }
};

// Converter para string JSON
const body = JSON.stringify(webhookData);

// Secret do webhook
const webhookSecret = 'PRESENTE';

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex');

console.log('Body:', body);
console.log('Signature:', `sha256=${signature}`);
console.log('\nPara testar o webhook, use:');
console.log(`curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "X-Hotmart-Signature: sha256=${signature}" \\`);
console.log(`  -d '${body}'`);