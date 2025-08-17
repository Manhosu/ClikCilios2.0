const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testarSaveClientImage() {
  console.log('🧪 Testando nova API save-client-image...');
  
  try {
    // 1. Fazer login com usuário de teste
    console.log('\n1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eduardo@teste.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', authData.user.email);
    
    // 2. Verificar se a tabela imagens_clientes existe
    console.log('\n2. Verificando tabela imagens_clientes...');
    const { data: tabelaTest, error: tabelaError } = await supabase
      .from('imagens_clientes')
      .select('count')
      .limit(1);
    
    if (tabelaError) {
      console.error('❌ Erro ao acessar tabela imagens_clientes:', tabelaError.message);
      console.log('\n📋 Instruções para criar a tabela:');
      console.log('1. Acesse o dashboard do Supabase');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o SQL do arquivo: migrations/create_imagens_clientes_table.sql');
      return;
    }
    
    console.log('✅ Tabela imagens_clientes acessível');
    
    // 3. Listar imagens existentes
    console.log('\n3. Listando imagens existentes...');
    const { data: imagensExistentes, error: listarError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });
    
    if (listarError) {
      console.error('❌ Erro ao listar imagens:', listarError.message);
      return;
    }
    
    console.log(`📊 Total de imagens existentes: ${imagensExistentes?.length || 0}`);
    
    if (imagensExistentes && imagensExistentes.length > 0) {
      console.log('\n📋 Últimas imagens:');
      imagensExistentes.slice(0, 3).forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.nome} (${img.tipo}) - ${new Date(img.created_at).toLocaleString()}`);
      });
    }
    
    // 4. Testar salvamento via API direta (simulando a nova API)
    console.log('\n4. Testando salvamento direto no banco...');
    
    const imagemTeste = {
      cliente_id: 'cliente-teste-123',
      user_id: authData.user.id,
      nome: `teste-api-${Date.now()}.jpg`,
      url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAA...',
      tipo: 'depois',
      descricao: 'Imagem de teste para nova API save-client-image'
    };
    
    const { data: novaImagem, error: criarError } = await supabase
      .from('imagens_clientes')
      .insert([imagemTeste])
      .select()
      .single();
    
    if (criarError) {
      console.error('❌ Erro ao salvar imagem:', criarError.message);
      return;
    }
    
    console.log('✅ Imagem salva com sucesso!');
    console.log('🆔 ID da imagem:', novaImagem.id);
    console.log('📁 Nome:', novaImagem.nome);
    console.log('🎯 Tipo:', novaImagem.tipo);
    console.log('👤 Cliente ID:', novaImagem.cliente_id);
    console.log('📝 Descrição:', novaImagem.descricao);
    
    // 5. Verificar se a imagem aparece na lista
    console.log('\n5. Verificando lista atualizada...');
    const { data: imagensAtualizadas, error: listarError2 } = await supabase
      .from('imagens_clientes')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listarError2) {
      console.error('❌ Erro ao listar imagens atualizadas:', listarError2.message);
      return;
    }
    
    console.log(`📊 Total de imagens após teste: ${imagensAtualizadas?.length || 0}`);
    
    if (imagensAtualizadas && imagensAtualizadas.length > 0) {
      console.log('\n📋 Últimas imagens (incluindo a nova):');
      imagensAtualizadas.forEach((img, index) => {
        const isNova = img.id === novaImagem.id;
        console.log(`   ${index + 1}. ${img.nome} (${img.tipo}) ${isNova ? '🆕' : ''} - ${new Date(img.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. A API save-client-image.ts está criada e pronta');
    console.log('2. O imagensService.ts foi atualizado com salvarViaAPI()');
    console.log('3. A página AplicarCiliosPage.tsx foi atualizada para usar a nova API');
    console.log('4. Teste a funcionalidade no frontend para confirmar integração completa');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarSaveClientImage();