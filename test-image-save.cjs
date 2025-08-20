const fs = require('fs').promises;
const path = require('path');

// Teste simples para verificar salvamento de imagem
async function testImageSave() {
  console.log('🧪 Testando salvamento de imagem...');
  
  try {
    // Criar uma imagem base64 simples (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    // Extrair dados da imagem
    const matches = testImageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Formato de imagem base64 inválido');
    }
    
    const [, imageType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Definir diretório e arquivo
    const projectRoot = process.cwd();
    const imageDir = path.join(projectRoot, 'minhas-imagens');
    const filename = `test-image-${Date.now()}.${imageType}`;
    const filePath = path.join(imageDir, filename);
    
    console.log(`📁 Diretório: ${imageDir}`);
    console.log(`📄 Arquivo: ${filename}`);
    
    // Verificar se o diretório existe
    try {
      await fs.access(imageDir);
      console.log('✅ Diretório existe');
    } catch (error) {
      console.log('❌ Diretório não existe, criando...');
      await fs.mkdir(imageDir, { recursive: true });
      console.log('✅ Diretório criado');
    }
    
    // Verificar permissões de escrita
    try {
      const testFile = path.join(imageDir, '.write-test-' + Date.now());
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log('✅ Permissões de escrita OK');
    } catch (error) {
      console.log('❌ Erro nas permissões de escrita:', error.message);
      return;
    }
    
    // Salvar a imagem
    await fs.writeFile(filePath, buffer);
    console.log('✅ Imagem salva');
    
    // Verificar se foi salva corretamente
    const stats = await fs.stat(filePath);
    console.log(`📊 Tamanho do arquivo: ${stats.size} bytes`);
    
    // Verificar integridade
    const savedBuffer = await fs.readFile(filePath);
    const verified = Buffer.compare(buffer, savedBuffer) === 0;
    console.log(`🔍 Integridade verificada: ${verified ? '✅' : '❌'}`);
    
    // Listar arquivos no diretório
    const files = await fs.readdir(imageDir);
    console.log(`📋 Arquivos no diretório (${files.length}):`);
    files.forEach(file => {
      if (file !== '.gitkeep') {
        console.log(`  - ${file}`);
      }
    });
    
    console.log('🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

// Executar o teste
testImageSave();