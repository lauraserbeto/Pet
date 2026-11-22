-- Preserva o histórico de atendimentos. Não arquiva pets existentes.
ALTER TABLE pets ADD COLUMN archived_at timestamptz;
