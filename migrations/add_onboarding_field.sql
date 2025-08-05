-- Adicionar campo de onboarding na tabela users
ALTER TABLE users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE; 