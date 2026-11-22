// Transporte de e-mail local para QA; nunca envia mensagens ao Resend.
const fs = require("node:fs");
const path = require("node:path");
const {
  prepareTestDatabase,
  disconnectTestDatabase,
} = require("../tests/helpers/dbIntegration");
async function main() {
  const outbox = process.env.QA_AUTH_OUTBOX_FILE;
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
    !outbox ||
    !path.isAbsolute(outbox)
  )
    throw Error(
      "Servidor QA exige ambiente test, banco local autorizado e outbox absoluto.",
    );
  await prepareTestDatabase();
  await disconnectTestDatabase();
  fs.writeFileSync(outbox, "[]", { flag: "wx" });
  require("../src/services/EmailService").sendPasswordReset = async (
    to,
    url,
  ) => {
    const messages = JSON.parse(fs.readFileSync(outbox, "utf8"));
    messages.push({ to, url });
    fs.writeFileSync(outbox, JSON.stringify(messages));
    return { id: "qa-local-message" };
  };
  require("../src/server");
}
main().catch(() => {
  console.error("Servidor QA não iniciado. Confira as condições de teste.");
  process.exitCode = 1;
});
