// Emissão, consumo do reset e troca autenticada usam a mesma ordem: User → tokens.
async function lockCredentials(tx, userId) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
}
module.exports = { lockCredentials };
