import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { 
  withErrorHandling,
  validateAuth,
  validateMethod,
  handleApiError
} from './middleware/validation';
// import { imagensService } from '../../src/services/imagensService'; // Comentado - não disponível na API

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface removida - não utilizada

interface SaveClientImageRequest {
  cliente_id: string;
  nome: string;
  url: string;
  tipo: 'antes' | 'depois' | 'processo';
  descricao?: string;
  base64Data?: string;
}

/**
 * Valida os dados da imagem do cliente
 */
function validateImageData(data: any): SaveClientImageRequest {
  const { cliente_id, nome, url, tipo, descricao } = data;

  if (!cliente_id || typeof cliente_id !== 'string') {
    throw new Error('cliente_id é obrigatório e deve ser uma string');
  }

  if (!nome || typeof nome !== 'string') {
    throw new Error('nome é obrigatório e deve ser uma string');
  }

  if (!url || typeof url !== 'string') {
    throw new Error('url é obrigatório e deve ser uma string');
  }

  if (!tipo || !['antes', 'depois', 'processo'].includes(tipo)) {
    throw new Error('tipo é obrigatório e deve ser: antes, depois ou processo');
  }

  return {
    cliente_id,
    nome,
    url,
    tipo,
    descricao: descricao || undefined
  };
}

// Função saveClientImage removida - não utilizada

/**
 * Handler principal da API
 */
const saveClientImageHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Validar método HTTP
    validateMethod(req, ['POST']);
    
    // Validar autenticação
    const authResult = await validateAuth(req);
    if (!authResult || !authResult.userId) {
      throw new Error('Falha na autenticação');
    }
    const { userId } = authResult;

    // Validar dados da requisição
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Dados da imagem são obrigatórios'
      });
    }

    // Validar e extrair dados da imagem
    const imageData = validateImageData(req.body);

    // Salvar imagem diretamente no Supabase
    const novaImagem = {
      user_id: userId,
      ...imageData
    };

    const { data, error } = await supabase
      .from('imagens_clientes')
      .insert([novaImagem])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar imagem do cliente:', error);
      throw new Error(`Erro ao salvar imagem: ${error.message}`);
    }

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: 'Imagem do cliente salva com sucesso',
      data: data
    });

  } catch (error) {
    handleApiError(error, res);
  }
};

export default withErrorHandling(saveClientImageHandler);