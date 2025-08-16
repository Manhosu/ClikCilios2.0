-- Script completo para criação das tabelas do sistema de imagens
-- Execute este script no Supabase SQL Editor


-- Criação das tabelas para o sistema de gerenciamento de imagens

-- Tabela para diretórios de imagens dos usuários
CREATE TABLE IF NOT EXISTS user_image_directories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    directory_path TEXT NOT NULL,
    total_images INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tabela para metadados das imagens dos usuários
CREATE TABLE IF NOT EXISTS user_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_path)
);

-- Índices para otimização
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


-- Políticas para administradores
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


SELECT 'Tabelas do sistema de imagens criadas com sucesso!' as resultado;