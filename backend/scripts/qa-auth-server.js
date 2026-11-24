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
  // Ler-modificar-escrever sem trava perdia mensagem quando dois cenários
  // pediam recuperação ao mesmo tempo — era a origem da instabilidade do E-09.
  // `mkdir` é atômico no POSIX e serve de trava sem dependência nova.
  const trava = outbox + ".lock";
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  require("../src/services/EmailService").sendPasswordReset = async (
    to,
    url,
  ) => {
    for (let tentativa = 0; tentativa < 200; tentativa += 1) {
      try {
        fs.mkdirSync(trava);
        break;
      } catch {
        await esperar(5);
      }
    }
    try {
      const messages = JSON.parse(fs.readFileSync(outbox, "utf8"));
      messages.push({ to, url });
      fs.writeFileSync(outbox, JSON.stringify(messages));
    } finally {
      try {
        fs.rmdirSync(trava);
      } catch {
        /* outro processo já liberou */
      }
    }
    return { id: "qa-local-message" };
  };
  require("../src/server");
}
main().catch(() => {
  console.error("Servidor QA não iniciado. Confira as condições de teste.");
  process.exitCode = 1;
});
