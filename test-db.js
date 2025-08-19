import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Verificar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Primeiros usuários:');
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.nome}) - ID: ${user.id}`);
        });
      }
    }
    
    // Verificar imagens
    const { data: images, error: imagesError } = await supabase
      .from('imagens_clientes')
      .select('id, user_id, nome, tipo')
      .limit(5);
    
    if (imagesError) {
      console.error('❌ Erro ao buscar imagens:', imagesError);
    } else {
      console.log('✅ Imagens encontradas:', images?.length || 0);
      if (images && images.length > 0) {
        console.log('📋 Primeiras imagens:');
        images.forEach(image => {
          console.log(`  - ${image.nome} (${image.tipo}) - User: ${image.user_id} - ID: ${image.id}`);
        });
      }
    }
    
    // Se temos usuários, vamos testar a API list-images com um usuário real
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testando API list-images com usuário: ${testUser.email}`);
      
      // Criar um token JWT válido usando o service role
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: testUser.email
        });
        
        if (authError) {
          console.error('❌ Erro ao gerar token:', authError);
        } else {
          // Tentar fazer login para obter um token válido
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: 'temp123' // senha temporária
          });
          
          if (sessionError) {
            console.log('⚠️ Não foi possível fazer login (senha não conhecida):', sessionError.message);
            console.log('📝 Vou testar a API diretamente sem token para ver o erro de autenticação');
            
            const response = await fetch('http://localhost:3000/api/list-images?page=1&limit=10', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            const result = await response.text();
            console.log('📡 Resposta da API list-images (sem token):', result);
          } else if (sessionData.session) {
            console.log('✅ Token obtido com sucesso');
            
            const response = await fetch('http://localhost:3000/api/list-images?page=1&limit=10', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            const result = await response.text();
            console.log('📡 Resposta da API list-images (com token):', result);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao testar API:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDatabase();