const fs = require("node:fs");
const bcrypt = require("bcryptjs");
const {
  prepareTestDatabase,
  disconnectTestDatabase,
} = require("../tests/helpers/dbIntegration");
const { seedRoles, createAuthenticatedTutor } = require("../tests/helpers/testSeed");
async function main() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
    !process.argv[2]
  )
    throw Error("Fixture exige banco local autorizado e arquivo temporário.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const cases = [];
    for (const width of [1280, 390]) {
      const currentPassword = "AntigaSenha1";
      const { tutor: user } = await createAuthenticatedTutor({
        email: ` QA-RESET-${width}@PETPLUS.TEST `,
        password_hash: await bcrypt.hash(currentPassword, 10),
      });
      cases.push({
        width,
        email: user.email.trim().toLowerCase(),
        currentPassword,
      });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ cases }), {
      flag: "wx",
    });
  } finally {
    await disconnectTestDatabase();
  }
}
main().catch((error) => {
  console.error("Fixture QA não criada.", error.code || error.name);
  process.exitCode = 1;
});
