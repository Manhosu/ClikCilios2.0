import http from 'http';
import url from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;

// Função para simular req/res do Next.js
function createNextApiHandler(handler) {
  return async (req, res) => {
    try {
      // Parse URL e query
      const parsedUrl = url.parse(req.url, true);
      
      // Parse body para POST requests
      let body = '';
      if (req.method === 'POST' || req.method === 'PUT') {
        await new Promise((resolve) => {
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', resolve);
        });
        
        try {
          body = JSON.parse(body);
        } catch {
          // Se não for JSON válido, manter como string
        }
      }

      // Simular NextApiRequest
      const nextReq = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: parsedUrl.query,
        body: body
      };

      // Simular NextApiResponse
      const nextRes = {
        status: (code) => {
          res.statusCode = code;
          return nextRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return nextRes;
        },
        send: (data) => {
          res.end(data);
          return nextRes;
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
          return nextRes;
        },
        end: (data) => {
          res.end(data);
          return nextRes;
        }
      };

      await handler(nextReq, nextRes);
    } catch (error) {
      console.error('Erro no handler da API:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }));
    }
  };
}

// Carregar handlers específicos
async function loadSaveClientImageHandler() {
  try {
    const apiPath = join(__dirname, 'api', 'save-client-image.ts');
    const apiModule = await import(`file://${apiPath}`);
    return apiModule.default;
  } catch (error) {
    console.error('Erro ao carregar save-client-image:', error);
    return null;
  }
}

async function loadTestSaveImageHandler() {
  try {
    const apiPath = join(__dirname, 'api', 'test-save-image.ts');
    const apiModule = await import(`file://${apiPath}`);
    return apiModule.default;
  } catch (error) {
    console.error('Erro ao carregar test-save-image:', error);
    return null;
  }
}

// Servidor HTTP simples
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/save-client-image') {
    const handler = await loadSaveClientImageHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler da API' 
      }));
    }
  } else if (parsedUrl.pathname === '/api/test-save-image') {
    const handler = await loadTestSaveImageHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler da API de teste' 
      }));
    }
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'API não encontrada',
      path: parsedUrl.pathname
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor de desenvolvimento rodando na porta ${PORT}`);
  console.log(`📡 API save-client-image disponível em http://localhost:${PORT}/api/save-client-image`);
});

server.on('error', (error) => {
  console.error('Erro no servidor:', error);
  process.exit(1);
});