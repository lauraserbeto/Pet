-- Bloco atômico: colisão impede índice/função sem alterar documentos históricos.
DO $migration$
BEGIN
CREATE FUNCTION petplus_normalize_document(input_document text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $normalize$
  SELECT translate(upper(input_document), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF./-', '');
$normalize$;
IF EXISTS (SELECT 1 FROM providers GROUP BY petplus_normalize_document(document) HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'E10_DOCUMENT_COLLISIONS: execute a auditoria somente leitura e aprove a conciliacao antes desta migration';
END IF;
CREATE UNIQUE INDEX providers_document_canonical_key ON providers (petplus_normalize_document(document));
END $migration$;
