-- Um único bloco é atômico e permite ao Prisma registrar o erro original.
DO $migration$
BEGIN

-- Não altera endereços legados. Mesma normalização de bordas e caixa da API.
CREATE FUNCTION petplus_normalize_email(input_email text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $normalize$
  SELECT lower(btrim(input_email, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'));
$normalize$;

-- Falha antes do índice, sem mesclar contas ou escolher um dono arbitrário.
  IF EXISTS (SELECT 1 FROM users GROUP BY petplus_normalize_email(email) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'E09_EMAIL_COLLISIONS: execute a auditoria somente leitura e aprove a conciliacao antes desta migration';
  END IF;

CREATE UNIQUE INDEX users_email_canonical_key ON users (petplus_normalize_email(email));
END $migration$;
