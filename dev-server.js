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

const PORT = process.env.DEV_API_PORT || 3005;

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
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/save-client-image.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('Erro ao carregar save-client-image handler:', error);
    return null;
  }
}

async function loadTestSaveImageHandler() {
  try {
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/test-save-image.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('Erro ao carregar test-save-image handler:', error);
    return null;
  }
}

async function loadTestAuthHandler() {
  try {
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/test-auth.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('Erro ao carregar test-auth handler:', error);
    return null;
  }
}

// Função para carregar o handler da API de teste simples
async function loadTestSaveSimpleHandler() {
  try {
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/test-save-simple.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('❌ Erro ao carregar handler de teste simples:', error);
    return null;
  }
}

// Função para carregar o handler da API list-images
async function loadListImagesHandler() {
  try {
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/list-images.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('❌ Erro ao carregar list-images:', error);
    return null;
  }
}

// Função para carregar o handler do webhook do Hotmart
async function loadHotmartWebhookHandler() {
  try {
    const { pathToFileURL } = await import('url');
    const filePath = pathToFileURL('./pages/api/hotmart/webhook.ts').href;
    const module = await import(filePath);
    return module.default;
  } catch (error) {
    console.error('❌ Erro ao carregar webhook do Hotmart:', error);
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
  } else if (parsedUrl.pathname === '/api/test-auth') {
    const handler = await loadTestAuthHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler da API de teste de autenticação' 
      }));
    }
  } else if (parsedUrl.pathname === '/api/test-save-simple') {
    const handler = await loadTestSaveSimpleHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler da API de teste simples' 
      }));
    }
  } else if (parsedUrl.pathname === '/api/list-images') {
    const handler = await loadListImagesHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler da API list-images' 
      }));
    }
  } else if (parsedUrl.pathname === '/api/hotmart/webhook') {
    const handler = await loadHotmartWebhookHandler();
    if (handler) {
      const nextHandler = createNextApiHandler(handler);
      await nextHandler(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Erro ao carregar handler do webhook do Hotmart' 
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
  console.log(`📡 API list-images disponível em http://localhost:${PORT}/api/list-images`);
  console.log(`🔗 Webhook Hotmart disponível em http://localhost:${PORT}/api/hotmart/webhook`);
});

server.on('error', (error) => {
  console.error('Erro no servidor:', error);
  process.exit(1);
});