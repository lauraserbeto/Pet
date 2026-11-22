// Exclusivo para QA local: não limpa tabelas nem acessa o ambiente publicado.
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../src/config/database");
const { prepareTestDatabase, disconnectTestDatabase } = require("../tests/helpers/dbIntegration");
const { seedRoles } = require("../tests/helpers/testSeed");

async function main() {
  const file = process.argv[2];
  const url = new URL(process.env.DATABASE_URL || "");
  if (process.env.NODE_ENV !== "test" || process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
      url.hostname !== "127.0.0.1" || url.pathname !== "/petplus_e13_test" || !file || !path.isAbsolute(file))
    throw Error("Exige petplus_e13_test local e arquivo temporário absoluto.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const cases = [];
    const password = "SenhaCorrecao123";
    const hash = await bcrypt.hash(password, 10);
    for (const width of [1280, 390]) for (const role of [2, 3]) {
      const user = await prisma.user.create({ data: { role_id: role, full_name: "Parceiro QA", email: `qa-correcao-${width}-${role}@petplus.test`, password_hash: hash, is_active: true } });
      const provider = await prisma.provider.create({ data: {
        user_id: user.id, business_name: `Parceiro QA ${role}`, document: `qa-e13-${width}-${role}`,
        document_type: "CNPJ", status: "REJEITADO", rejection_reason: "Revise os dados de endereço.",
        zip_code: "74000000", state: "GO", city: "Goiânia", phone: "11999990000", address_line: "Rua QA, 10",
      } });
      cases.push({ width, role, email: user.email, password, token: jwt.sign({ id: user.id, role_id: role }, process.env.JWT_SECRET), providerId: provider.id });
    }
    fs.writeFileSync(file, JSON.stringify({ cases }), { flag: "wx" });
    console.log("Fixture E-13 criada: quatro parceiros sintéticos.");
  } finally { await disconnectTestDatabase(); }
}
main().catch((error) => { console.error("Fixture E-13 falhou:", error.code || error.name); process.exitCode = 1; });
