-- Não atribui data/versão nem altera o booleano das contas existentes.
ALTER TABLE users ALTER COLUMN terms_accepted SET DEFAULT false;
ALTER TABLE users ADD COLUMN terms_accepted_at timestamptz,
                  ADD COLUMN terms_version varchar(30);
ALTER TABLE users ADD CONSTRAINT users_terms_metadata_consistent CHECK (
  (terms_accepted_at IS NULL AND terms_version IS NULL)
  OR (terms_accepted = true AND terms_accepted_at IS NOT NULL AND terms_version IS NOT NULL AND length(trim(terms_version)) > 0)
);
