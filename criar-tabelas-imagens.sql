-- Criação das tabelas para o sistema de gerenciamento de imagens
-- Execute este script no Supabase SQL Editor

-- Tabela para diretórios de imagens dos usuários
CREATE TABLE IF NOT EXISTS user_image_directories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    directory_path TEXT NOT NULL,
    total_images INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0, -- em bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(user_id)
);

-- Tabela para metadados das imagens dos usuários
CREATE TABLE IF NOT EXISTS user_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- em bytes
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(file_path)
);

-- Índices adicionais para otimização
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_created_at ON user_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_image_directories_user_id ON user_image_directories(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_user_image_directories_updated_at ON user_image_directories;
CREATE TRIGGER update_user_image_directories_updated_at
    BEFORE UPDATE ON user_image_directories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_images_updated_at ON user_images;
CREATE TRIGGER update_user_images_updated_at
    BEFORE UPDATE ON user_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE user_image_directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;

-- Políticas para user_image_directories
DROP POLICY IF EXISTS "Usuários podem ver seus próprios diretórios" ON user_image_directories;
CREATE POLICY "Usuários podem ver seus próprios diretórios"
    ON user_image_directories FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios diretórios" ON user_image_directories;
CREATE POLICY "Usuários podem inserir seus próprios diretórios"
    ON user_image_directories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios diretórios" ON user_image_directories;
CREATE POLICY "Usuários podem atualizar seus próprios diretórios"
    ON user_image_directories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios diretórios" ON user_image_directories;
CREATE POLICY "Usuários podem deletar seus próprios diretórios"
    ON user_image_directories FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para user_images
DROP POLICY IF EXISTS "Usuários podem ver suas próprias imagens" ON user_images;
CREATE POLICY "Usuários podem ver suas próprias imagens"
    ON user_images FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias imagens" ON user_images;
CREATE POLICY "Usuários podem inserir suas próprias imagens"
    ON user_images FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias imagens" ON user_images;
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
    ON user_images FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias imagens" ON user_images;
CREATE POLICY "Usuários podem deletar suas próprias imagens"
    ON user_images FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para administradores (se necessário)
DROP POLICY IF EXISTS "Admins podem ver todos os diretórios" ON user_image_directories;
CREATE POLICY "Admins podem ver todos os diretórios"
    ON user_image_directories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Admins podem ver todas as imagens" ON user_images;
CREATE POLICY "Admins podem ver todas as imagens"
    ON user_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Função para limpar imagens órfãs (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove imagens cujos usuários não existem mais
    DELETE FROM user_images 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Remove diretórios cujos usuários não existem mais
    DELETE FROM user_image_directories 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas tabelas
COMMENT ON TABLE user_image_directories IS 'Diretórios de imagens dos usuários com estatísticas';
COMMENT ON TABLE user_images IS 'Metadados das imagens armazenadas pelos usuários';

COMMENT ON COLUMN user_image_directories.directory_path IS 'Caminho físico do diretório no sistema de arquivos';
COMMENT ON COLUMN user_image_directories.total_images IS 'Número total de imagens no diretório';
COMMENT ON COLUMN user_image_directories.total_size IS 'Tamanho total em bytes de todas as imagens';

COMMENT ON COLUMN user_images.filename IS 'Nome único do arquivo no sistema';
COMMENT ON COLUMN user_images.original_name IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN user_images.file_path IS 'Caminho completo do arquivo no sistema';
COMMENT ON COLUMN user_images.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN user_images.mime_type IS 'Tipo MIME do arquivo (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN user_images.width IS 'Largura da imagem em pixels';
COMMENT ON COLUMN user_images.height IS 'Altura da imagem em pixels';

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO user_image_directories (user_id, directory_path) 
-- VALUES ('00000000-0000-0000-0000-000000000000', './minhas-imagens/00000000-0000-0000-0000-000000000000');

SELECT 'Tabelas do sistema de imagens criadas com sucesso!' as resultado;