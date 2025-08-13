-- Criar tabela webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at);

-- Habilitar RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow webhook inserts" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow service role updates" ON public.webhook_events;

-- Política para permitir inserção de webhooks
CREATE POLICY "Allow webhook inserts" ON public.webhook_events
  FOR INSERT WITH CHECK (true);

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated read" ON public.webhook_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir atualização para service role
CREATE POLICY "Allow service role updates" ON public.webhook_events
  FOR UPDATE USING (auth.role() = 'service_role');