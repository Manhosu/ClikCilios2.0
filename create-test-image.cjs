const fs = require('fs');
const { createCanvas } = require('canvas');

// Criar um canvas
const canvas = createCanvas(400, 400);
const ctx = canvas.getContext('2d');

// Criar uma imagem simples de rosto para teste
ctx.fillStyle = '#fdbcb4'; // cor de pele
ctx.fillRect(0, 0, 400, 400);

// Rosto oval
ctx.fillStyle = '#f4a688';
ctx.beginPath();
ctx.ellipse(200, 200, 120, 150, 0, 0, 2 * Math.PI);
ctx.fill();

// Olhos
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.ellipse(170, 170, 25, 15, 0, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.ellipse(230, 170, 25, 15, 0, 0, 2 * Math.PI);
ctx.fill();

// Pupilas
ctx.fillStyle = '#333333';
ctx.beginPath();
ctx.ellipse(170, 170, 8, 8, 0, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.ellipse(230, 170, 8, 8, 0, 0, 2 * Math.PI);
ctx.fill();

// Nariz
ctx.fillStyle = '#e09b81';
ctx.beginPath();
ctx.ellipse(200, 200, 8, 12, 0, 0, 2 * Math.PI);
ctx.fill();

// Boca
ctx.fillStyle = '#d67b7b';
ctx.beginPath();
ctx.ellipse(200, 240, 20, 8, 0, 0, 2 * Math.PI);
ctx.fill();

// Sobrancelhas
ctx.fillStyle = '#8b4513';
ctx.fillRect(150, 150, 40, 4);
ctx.fillRect(210, 150, 40, 4);

// Salvar a imagem
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-face.png', buffer);

console.log('✅ Imagem de teste criada: test-face.png');