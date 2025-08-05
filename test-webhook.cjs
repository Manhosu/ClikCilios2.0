require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');

const payload = fs.readFileSync('temp_payload.json', 'utf8');
const secret = process.env.HOTMART_WEBHOOK_SECRET;

if (!secret) {
    console.error('Erro: A variável de ambiente HOTMART_WEBHOOK_SECRET não está definida.');
    process.exit(1);
}

const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload, 'utf8');
const signature = 'sha256=' + hmac.digest('hex');

const url = 'https://clik-cilios2-0.vercel.app/api/debug-webhook-main';

console.log('Enviando requisição para:', url);
// console.log('Payload:', payload);
console.log('Assinatura:', signature);

axios.post(url, payload, {
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-hotmart-signature': signature
    },
    // Enviar como buffer para evitar problemas de encoding
    transformRequest: (data, headers) => {
        return data;
    }
})
.then(res => {
    console.log('Status:', res.status, res.statusText);
    fs.writeFileSync('debug-output.log', typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
    console.log('Corpo da Resposta salvo em debug-output.log');
    if (res.status !== 200) {
        console.error('O teste falhou com status diferente de 200.');
        process.exit(1);
    }
})
.catch(err => {
    console.error('Erro na requisição:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
    process.exit(1);
});