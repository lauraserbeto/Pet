process.env.LOG_LEVEL = "silent";
process.env.FRONTEND_URL ||= "http://localhost:5173";

// E-11 / AUD-15 / DEC-D — moderação de parceiros e candidaturas de Pet Sitter
// com PostgreSQL real: transições, aprovação do sitter só pela avaliação,
// candidatura única, revisão só de PENDING e decisões concorrentes.
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const prisma = require("../../src/config/database");
const app = require("../../src/app");
const { PROVIDER_STATUS } = require("../../src/constants/providerStatus");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createApprovedPartner,
} = require("../helpers/testSeed");

const skip = getDbIntegrationSkipReason();
let prepared = false;
before(async () => {
  if (!skip) {
    await prepareTestDatabase();
    prepared = true;
  }
});
beforeEach(async () => {
  if (!skip) {
    await resetTestDatabase();
    await seedRoles();
  }
});
after(async () => {
  if (prepared) await disconnectTestDatabase();
});

const auth = (user) =>
  "Bearer " + jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET);

async function admin() {
  const { tutor } = await createAuthenticatedTutor();
  return prisma.user.update({ where: { id: tutor.id }, data: { role_id: 1 } });
}

async function partner({ role_id = 3, status = PROVIDER_STATUS.PENDING, sitterEvaluation = false } = {}) {
  const ctx = await createApprovedPartner({ role_id, sitterEvaluation });
  await prisma.provider.update({ where: { id: ctx.provider.id }, data: { status } });
  return ctx;
}

const setStatus = (adm, providerId, body) =>
  request(app).patch(`/api/v1/providers/${providerId}/status`).set("Authorization", auth(adm)).send(body);

const submit = (user) =>
  request(app)
    .post("/api/v1/users/me/evaluations")
    .set("Authorization", auth(user))
    .send({ experience_details: "Experiência QA", environment_photos: [], quiz_answers: {} });

const review = (adm, id, body) =>
  request(app).patch(`/api/v1/users/admin/evaluations/${id}`).set("Authorization", auth(adm)).send(body);

test("E-11 DB: transições válidas passam e inválidas respondem 422 sem alterar o parceiro", { skip }, async () => {
  const adm = await admin();
  const { provider } = await partner({ status: PROVIDER_STATUS.PENDING });

  assert.equal((await setStatus(adm, provider.id, { status: PROVIDER_STATUS.APPROVED })).status, 200);

  const repeat = await setStatus(adm, provider.id, { status: PROVIDER_STATUS.APPROVED });
  assert.equal(repeat.status, 422);
  assert.equal(repeat.body.error.code, "INVALID_PROVIDER_TRANSITION");

  // Aprovado não vira recusado por aqui (suspender é desativar a conta — DEC-G).
  const toRejected = await setStatus(adm, provider.id, {
    status: PROVIDER_STATUS.REJECTED,
    rejection_reason: "Motivo QA",
  });
  assert.equal(toRejected.status, 422);
  assert.equal(toRejected.body.error.code, "INVALID_PROVIDER_TRANSITION");
  assert.equal((await prisma.provider.findUnique({ where: { id: provider.id } })).status, PROVIDER_STATUS.APPROVED);

  const { provider: rejected } = await partner({ status: PROVIDER_STATUS.REJECTED });
  assert.equal((await setStatus(adm, rejected.id, { status: PROVIDER_STATUS.APPROVED })).status, 200);
  const backToPending = await setStatus(adm, rejected.id, { status: PROVIDER_STATUS.PENDING });
  assert.equal(backToPending.status, 422);
});

test("E-11 DB: Pet Sitter só é aprovado pela avaliação (DEC-D)", { skip }, async () => {
  const adm = await admin();
  const semAvaliacao = await partner({ role_id: 4, status: PROVIDER_STATUS.PENDING });

  const blocked = await setStatus(adm, semAvaliacao.provider.id, { status: PROVIDER_STATUS.APPROVED });
  assert.equal(blocked.status, 422);
  assert.equal(blocked.body.error.code, "SITTER_APPROVAL_REQUIRES_EVALUATION");
  assert.equal(
    (await prisma.provider.findUnique({ where: { id: semAvaliacao.provider.id } })).status,
    PROVIDER_STATUS.PENDING,
  );

  // Com avaliação aprovada (ex.: reconsiderar recusa de cadastro), a aprovação é aceita.
  const comAvaliacao = await partner({ role_id: 4, status: PROVIDER_STATUS.REJECTED, sitterEvaluation: true });
  assert.equal((await setStatus(adm, comAvaliacao.provider.id, { status: PROVIDER_STATUS.APPROVED })).status, 200);
});

test("E-11 DB: aprovação e recusa concorrentes respeitam a ordem serializada das transições", { skip }, async () => {
  const adm = await admin();
  const { provider } = await partner({ status: PROVIDER_STATUS.IN_REVIEW });

  const results = await Promise.all([
    setStatus(adm, provider.id, { status: PROVIDER_STATUS.APPROVED }),
    setStatus(adm, provider.id, { status: PROVIDER_STATUS.REJECTED, rejection_reason: "Motivo QA" }),
  ]);
  // Aprovar primeiro impede recusar APROVADO. Recusar primeiro permite a
  // reconsideração REJEITADO → APROVADO (DEC-D), portanto dois 200 são válidos.
  const [approval, rejection] = results;
  assert.equal(approval.status, 200);
  assert.equal(approval.body.status, PROVIDER_STATUS.APPROVED);
  if (rejection.status === 200) {
    assert.equal(rejection.body.status, PROVIDER_STATUS.REJECTED);
  } else {
    assert.equal(rejection.status, 422);
    assert.equal(rejection.body.error.code, "INVALID_PROVIDER_TRANSITION");
    assert.equal(rejection.body.error.details.from, PROVIDER_STATUS.APPROVED);
  }
  const final = await prisma.provider.findUnique({ where: { id: provider.id } });
  assert.equal(final.status, PROVIDER_STATUS.APPROVED);
  assert.equal(final.rejection_reason, null);
});

test("E-11 DB: recusa seguida de reconsideração permite duas decisões e remove o motivo", { skip }, async () => {
  const adm = await admin();
  const { provider } = await partner({ status: PROVIDER_STATUS.IN_REVIEW });
  assert.equal((await setStatus(adm, provider.id, { status: PROVIDER_STATUS.REJECTED, rejection_reason: "Motivo QA" })).status, 200);
  assert.equal((await prisma.provider.findUnique({ where: { id: provider.id } })).status, PROVIDER_STATUS.REJECTED);
  assert.equal((await setStatus(adm, provider.id, { status: PROVIDER_STATUS.APPROVED })).status, 200);
  const final = await prisma.provider.findUnique({ where: { id: provider.id } });
  assert.equal(final.status, PROVIDER_STATUS.APPROVED);
  assert.equal(final.rejection_reason, null);
});

test("E-11 DB: aprovação seguida de recusa mantém a aprovação e responde 422", { skip }, async () => {
  const adm = await admin();
  const { provider } = await partner({ status: PROVIDER_STATUS.IN_REVIEW });
  assert.equal((await setStatus(adm, provider.id, { status: PROVIDER_STATUS.APPROVED })).status, 200);
  const rejected = await setStatus(adm, provider.id, { status: PROVIDER_STATUS.REJECTED, rejection_reason: "Motivo QA" });
  assert.equal(rejected.status, 422);
  assert.equal(rejected.body.error.code, "INVALID_PROVIDER_TRANSITION");
  const final = await prisma.provider.findUnique({ where: { id: provider.id } });
  assert.equal(final.status, PROVIDER_STATUS.APPROVED);
  assert.equal(final.rejection_reason, null);
});

test("E-11 DB: candidatura única — bloqueia reenvio pendente ou aprovado, permite após recusa", { skip }, async () => {
  const adm = await admin();
  const { partnerUser, provider } = await partner({ role_id: 4 });

  assert.equal((await submit(partnerUser)).status, 201);
  const dup = await submit(partnerUser);
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, "EVALUATION_ALREADY_PENDING");

  const first = await prisma.sitterEvaluation.findFirst({ where: { user_id: partnerUser.id } });
  const noFeedback = await review(adm, first.id, { status: "REJECTED" });
  assert.equal(noFeedback.status, 422, "recusa sem motivo é recusada");

  assert.equal((await review(adm, first.id, { status: "REJECTED", feedback: "Envie fotos do ambiente." })).status, 200);
  let user = await prisma.user.findUnique({ where: { id: partnerUser.id } });
  assert.equal(user.onboarding_step, "REJECTED");
  assert.equal((await prisma.provider.findUnique({ where: { id: provider.id } })).status, PROVIDER_STATUS.PENDING);

  const second = await submit(partnerUser);
  assert.equal(second.status, 201, "nova candidatura após recusa");
  user = await prisma.user.findUnique({ where: { id: partnerUser.id } });
  assert.equal(user.onboarding_step, "IN_REVIEW");

  assert.equal((await review(adm, second.body.evaluation.id, { status: "APPROVED" })).status, 200);
  user = await prisma.user.findUnique({ where: { id: partnerUser.id } });
  assert.equal(user.onboarding_step, "COMPLETED");
  assert.equal((await prisma.provider.findUnique({ where: { id: provider.id } })).status, PROVIDER_STATUS.APPROVED);

  const afterApproval = await submit(partnerUser);
  assert.equal(afterApproval.status, 409);
  assert.equal(afterApproval.body.error.code, "EVALUATION_ALREADY_APPROVED");
  assert.equal(await prisma.sitterEvaluation.count({ where: { user_id: partnerUser.id } }), 2);
});

test("E-11 DB: candidatura já revisada não é revisada de novo, nem em paralelo", { skip }, async () => {
  const adm = await admin();
  const { partnerUser, provider } = await partner({ role_id: 4 });
  const sent = await submit(partnerUser);

  const results = await Promise.all([
    review(adm, sent.body.evaluation.id, { status: "APPROVED" }),
    review(adm, sent.body.evaluation.id, { status: "REJECTED", feedback: "Motivo QA" }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal(results.find((r) => r.status === 409).body.error.code, "EVALUATION_ALREADY_REVIEWED");

  const evaluation = await prisma.sitterEvaluation.findUnique({ where: { id: sent.body.evaluation.id } });
  const user = await prisma.user.findUnique({ where: { id: partnerUser.id } });
  const prov = await prisma.provider.findUnique({ where: { id: provider.id } });
  // Estado coerente com a decisão vencedora nas três tabelas.
  if (evaluation.status === "APPROVED") {
    assert.equal(user.onboarding_step, "COMPLETED");
    assert.equal(prov.status, PROVIDER_STATUS.APPROVED);
  } else {
    assert.equal(user.onboarding_step, "REJECTED");
    assert.notEqual(prov.status, PROVIDER_STATUS.APPROVED);
  }
});

test("E-11 DB: envios simultâneos criam uma única candidatura pendente", { skip }, async () => {
  const { partnerUser } = await partner({ role_id: 4 });
  const results = await Promise.all([submit(partnerUser), submit(partnerUser), submit(partnerUser)]);

  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 2);
  assert.equal(
    await prisma.sitterEvaluation.count({ where: { user_id: partnerUser.id, status: "PENDING" } }),
    1,
  );
});
