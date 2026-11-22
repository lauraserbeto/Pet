const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../src/config/database");
const { prepareTestDatabase, disconnectTestDatabase } = require("../tests/helpers/dbIntegration");
const { seedRoles } = require("../tests/helpers/testSeed");

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  const file = process.argv[2];
  if (process.env.NODE_ENV !== "test" || process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
      url.hostname !== "127.0.0.1" || url.pathname !== "/petplus_e33_test" || !file || !path.isAbsolute(file))
    throw Error("Exige banco E33 local e saída temporária absoluta.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const accounts = [];
    const password = "RotasSenha123";
    const hash = await bcrypt.hash(password, 10);
    async function seed(role, kind, width) {
      const user = await prisma.user.create({ data: {
        role_id: role, full_name: "Conta QA", email: `qa-rotas-${role}-${kind}-${width}@petplus.test`,
        password_hash: hash, is_active: kind !== "disabled", onboarding_step: kind === "pending" ? "IN_REVIEW" : "COMPLETED",
      } });
      if ([2, 3, 4].includes(role)) {
        await prisma.provider.create({ data: {
          user_id: user.id, business_name: `Parceiro QA ${role}`, document: `qa${role}${kind.slice(0, 3)}${width}`, document_type: "CNPJ",
          status: kind === "pending" || kind === "inconsistent" ? "EM_REVISAO" : "APROVADO",
          description: "Conta de teste", city: "Goiânia", state: "GO", zip_code: "74000000", address_line: "Rua QA", phone: "11999990000",
        } });
        if (role === 4 && kind === "ready") await prisma.sitterEvaluation.create({ data: { user_id: user.id, experience_details: "Experiência de QA", status: "APPROVED" } });
      }
      accounts.push({ kind, width, role, email: user.email, password, user,
        expiredToken: jwt.sign({ id: user.id, role_id: role }, process.env.JWT_SECRET, { expiresIn: -10 }),
        token: jwt.sign({ id: user.id, role_id: role }, process.env.JWT_SECRET) });
    }
    for (const width of [1280, 390]) {
      for (const role of [1, 2, 3, 4, 5]) await seed(role, "ready", width);
      await seed(4, "pending", width);
      await seed(4, "inconsistent", width);
    }
    await seed(5, "disabled", 1280);
    fs.writeFileSync(file, JSON.stringify({ accounts }), { flag: "wx" });
    console.log("Fixture E33 criada: contas sintéticas dos cinco perfis e estados de teste.");
  } finally { await disconnectTestDatabase(); }
}
main().catch((error) => { console.error("Fixture E33 falhou:", error.code || error.name); process.exitCode = 1; });
