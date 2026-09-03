-- Migration manual: normaliza species para o enum DOG/CAT/OTHER
-- Aplicar após o deploy do PetController para garantir consistência.
-- Dados pré-existentes em português são convertidos; valores desconhecidos viram OTHER.

UPDATE "pets"
   SET "species" = 'DOG'
 WHERE LOWER(TRIM("species")) IN ('cachorro', 'dog', 'cao', 'cão');

UPDATE "pets"
   SET "species" = 'CAT'
 WHERE LOWER(TRIM("species")) IN ('gato', 'cat');

UPDATE "pets"
   SET "species" = 'OTHER'
 WHERE "species" NOT IN ('DOG', 'CAT', 'OTHER');
