import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  withErrorHandling,
  validateAuth,
  validateMethod,
  handleApiError,
  AuthenticationError
} from '../middleware/validation';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  tipo?: 'usuario' | 'admin';
}

/**
 * Valida se o usuário autenticado é admin
 */
async function validateAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email, is_admin')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Verifica se é a Carina ou tem a flag is_admin
    return user.email === 'carinaprange86@gmail.com' || user.is_admin === true;
  } catch (error) {
    console.error('Erro ao validar admin:', error);
    return false;
  }
}

/**
 * Valida os dados de entrada
 */
function validateUserData(data: any): CreateUserRequest {
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    throw new Error('Nome é obrigatório');
  }

  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    throw new Error('Email válido é obrigatório');
  }

  if (!data.senha || typeof data.senha !== 'string' || data.senha.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres');
  }

  const tipo = data.tipo || 'usuario';
  if (tipo !== 'usuario' && tipo !== 'admin') {
    throw new Error('Tipo deve ser "usuario" ou "admin"');
  }

  return {
    nome: data.nome.trim(),
    email: data.email.trim().toLowerCase(),
    senha: data.senha,
    tipo
  };
}

/**
 * Handler principal da API
 */
const createUserHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validar método HTTP
  validateMethod(req, ['POST']);

  // Validar autenticação
  const authResult = await validateAuth(req);
  if (!authResult || !authResult.userId) {
    throw new AuthenticationError('Falha na autenticação');
  }
  const { userId } = authResult;

  // Validar se é admin
  const isAdmin = await validateAdmin(userId);
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Apenas administradores podem criar usuários'
    });
  }

  // Validar dados de entrada
  const userData = validateUserData(req.body);

  // Verificar se o email já existe
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', userData.email)
    .single();

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Email já cadastrado no sistema'
    });
  }

  // Criar usuário no Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.senha,
    email_confirm: true, // Confirma o email automaticamente
    user_metadata: {
      nome: userData.nome,
      is_admin: userData.tipo === 'admin',
      created_by: 'admin',
      created_by_user_id: userId
    }
  });

  if (authError || !authUser.user) {
    console.error('Erro ao criar usuário no Auth:', authError);
    throw new Error(`Erro ao criar usuário: ${authError?.message || 'Erro desconhecido'}`);
  }

  // Criar registro na tabela users
  const { data: newUser, error: dbError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: userData.email,
      nome: userData.nome,
      is_admin: userData.tipo === 'admin',
      onboarding_completed: false,
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (dbError) {
    console.error('Erro ao criar registro do usuário:', dbError);

    // Tentar remover o usuário do Auth em caso de erro
    try {
      await supabase.auth.admin.deleteUser(authUser.user.id);
    } catch (cleanupError) {
      console.error('Erro ao limpar usuário do Auth:', cleanupError);
    }

    throw new Error(`Erro ao salvar dados do usuário: ${dbError.message}`);
  }

  // Criar configurações padrão do usuário
  await supabase
    .from('configuracoes_usuario')
    .insert({
      user_id: authUser.user.id,
      notificacoes_email: true,
      tema: 'light',
      idioma: 'pt-BR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      id: newUser.id,
      email: newUser.email,
      nome: newUser.nome,
      is_admin: newUser.is_admin,
      created_at: newUser.created_at
    }
  });
};

export default withErrorHandling(createUserHandler);
