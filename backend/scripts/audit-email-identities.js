// Auditoria sem UPDATE/DELETE e sem imprimir endereços, senhas ou tokens.
const crypto = require("node:crypto");
const prisma = require("../src/config/database");
const { EMAIL_TRIM_CHARS } = require("../src/security/emailIdentity");
async function auditEmailIdentities(db = prisma) {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const counts =
        await tx.$queryRaw`SELECT count(*)::int AS total, count(*) FILTER (WHERE email <> lower(btrim(email, ${EMAIL_TRIM_CHARS})))::int AS noncanonical FROM users`;
      const rows =
        await tx.$queryRaw`WITH identities AS (SELECT id, lower(btrim(email, ${EMAIL_TRIM_CHARS})) AS canonical FROM users) SELECT canonical, array_agg(id::text ORDER BY id) AS ids FROM identities GROUP BY canonical HAVING count(*) > 1`;
      return {
        ...counts[0],
        collision_groups: rows.map((row) => ({
          fingerprint: crypto
            .createHash("sha256")
            .update(row.canonical)
            .digest("hex"),
          user_ids: row.ids,
          count: row.ids.length,
        })),
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 15000 },
  );
}
if (require.main === module) {
  (async () => {
    if (process.env.EMAIL_AUDIT_READONLY !== "true")
      throw Error("Ative EMAIL_AUDIT_READONLY=true para executar a auditoria.");
    console.log(JSON.stringify(await auditEmailIdentities(), null, 2));
  })()
    .catch(() => {
      console.error(
        "Auditoria não concluída. Confira a configuração e a conexão autorizada.",
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
module.exports = { auditEmailIdentities };
