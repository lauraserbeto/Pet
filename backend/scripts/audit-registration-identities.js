// Preflight de leitura: não imprimir documentos, endereços ou datas de aceite.
const crypto = require("node:crypto");
const prisma = require("../src/config/database");
const { EMAIL_TRIM_CHARS } = require("../src/security/emailIdentity");
const {
  normalizeDocument,
  isValidCPF,
  isValidCNPJ,
} = require("../src/security/documentIdentity");
async function auditRegistrationIdentities(db = prisma) {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const users =
        await tx.$queryRaw`SELECT count(*)::int AS total, count(*) FILTER (WHERE terms_accepted = true)::int AS boolean_true FROM users`;
      const providers =
        await tx.$queryRaw`SELECT p.id, p.document, p.document_type, u.role_id FROM providers p JOIN users u ON u.id=p.user_id`;
      const rows =
        await tx.$queryRaw`WITH identities AS (SELECT id, translate(upper(document), ${EMAIL_TRIM_CHARS + "./-"}, '') AS canonical FROM providers) SELECT canonical, array_agg(id::text ORDER BY id) AS ids FROM identities GROUP BY canonical HAVING count(*) > 1`;
      return {
        users: users[0],
        providers: providers.length,
        noncanonical: providers.filter(
          (p) => p.document !== normalizeDocument(p.document),
        ).length,
        invalid_providers: providers
          .filter(
            (p) =>
              !(
                [2, 3, 4].includes(p.role_id) &&
                ([2, 3].includes(p.role_id)
                  ? p.document_type === "CNPJ"
                  : ["CPF", "CNPJ"].includes(p.document_type)) &&
                (p.document_type === "CPF"
                  ? isValidCPF(p.document)
                  : isValidCNPJ(p.document))
              ),
          )
          .map((p) => ({ id: p.id })),
        collision_groups: rows.map((row) => ({
          fingerprint: crypto
            .createHash("sha256")
            .update(row.canonical)
            .digest("hex"),
          provider_ids: row.ids,
          count: row.ids.length,
        })),
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 15000 },
  );
}
if (require.main === module) {
  (async () => {
    if (process.env.REGISTRATION_AUDIT_READONLY !== "true")
      throw Error("Auditoria somente leitura não autorizada.");
    console.log(JSON.stringify(await auditRegistrationIdentities(), null, 2));
  })()
    .catch(() => {
      console.error(
        "Auditoria de cadastro não concluída. Confira a conexão autorizada.",
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
module.exports = { auditRegistrationIdentities };
