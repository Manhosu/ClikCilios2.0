const crypto = require('crypto');

// Segredo real obtido do debug
const HOTMART_WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Corpo da requisição (exato)
const requestBody = '{"id":"test-123","event":"PURCHASE_APPROVED","data":{"purchase":{"order_id":"ORDER-123","order_date":1641024000000,"status":"APPROVED","buyer":{"name":"João Silva","email":"joao@teste.com"},"offer":{"code":"OFFER-123","name":"Produto Teste"},"price":{"value":97,"currency_code":"BRL"},"tracking":{"coupon":"DESCONTO10","source":"facebook"}}}}';

console.log('🔍 Gerando assinatura HMAC com segredo real...');
console.log('Segredo:', HOTMART_WEBHOOK_SECRET);
console.log('Comprimento da string:', requestBody.length);
console.log('Bytes UTF-8:', Buffer.byteLength(requestBody, 'utf8'));

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', HOTMART_WEBHOOK_SECRET)
  .update(requestBody, 'utf8')
  .digest('hex');

const fullSignature = `sha256=${signature}`;

console.log('\n✅ Assinatura gerada:', fullSignature);

// Comando curl para teste
const curlCommand = `curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook-raw \\
  -H "Content-Type: application/json" \\
  -H "X-Hotmart-Signature: ${fullSignature}" \\
  -d '${requestBody}'`;

console.log('\n🚀 Comando para testar o webhook RAW:');
console.log(curlCommand);

// PowerShell command
const powershellCommand = `$headers = @{"Content-Type" = "application/json"; "X-Hotmart-Signature" = "${fullSignature}"}; $body = '${requestBody}'; try { $response = Invoke-WebRequest -Uri "https://clik-cilios2-0.vercel.app/api/hotmart-webhook-raw" -Method POST -Headers $headers -Body $body -ErrorAction Stop; Write-Host "Status: $($response.StatusCode)"; Write-Host "Response: $($response.Content)" } catch { Write-Host "Error: $($_.Exception.Message)"; Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" }`;

console.log('\n🚀 Comando PowerShell para testar:');
console.log(powershellCommand);