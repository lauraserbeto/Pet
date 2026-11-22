process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const prisma = require("../../src/config/database"),
  app = require("../../src/app");
const updateProfile = require("../../src/useCases/providers/UpdateProviderProfileUseCase");
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
  createService,
  createPet,
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
  "Bearer " +
  jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET);
async function actor(role_id = 5) {
  const { tutor } = await createAuthenticatedTutor();
  return prisma.user.update({ where: { id: tutor.id }, data: { role_id } });
}
async function publish(role_id) {
  const ctx = await createApprovedPartner({ role_id });
  await createService(ctx.provider.id);
  await prisma.provider.update({
    where: { id: ctx.provider.id },
    data: {
      description: "Descrição pública QA",
      phone: "11999990000",
      zip_code: "01001000",
      address_line: "Rua privada QA, 42",
      city: "São Paulo",
      state: "SP",
      gallery_images: ["https://example.test/public.png"],
      sitter_roles: ["SITTING"],
    },
  });
  return ctx;
}
test(
  "SEC-2 DB: métricas exigem administrador ativo; papel atual do banco prevalece sobre JWT antigo",
  { skip },
  async () => {
    assert.equal((await request(app).get("/api/metrics")).status, 401);
    const tutor = await actor(),
      admin = await actor(1);
    assert.equal(
      (await request(app).get("/api/metrics").set("Authorization", auth(tutor)))
        .status,
      403,
    );
    const forgedRole = jwt.sign(
      { id: tutor.id, role_id: 1 },
      process.env.JWT_SECRET,
    );
    assert.equal(
      (
        await request(app)
          .get("/api/metrics")
          .set("Authorization", "Bearer " + forgedRole)
      ).status,
      403,
    );
    const header = auth(admin);
    assert.equal(
      (await request(app).get("/api/metrics").set("Authorization", header))
        .status,
      200,
    );
    await prisma.user.update({ where: { id: admin.id }, data: { role_id: 5 } });
    assert.equal(
      (await request(app).get("/api/metrics").set("Authorization", header))
        .status,
      403,
    );
    await prisma.user.update({
      where: { id: admin.id },
      data: { role_id: 1, is_active: false },
    });
    assert.equal(
      (await request(app).get("/api/metrics").set("Authorization", header))
        .status,
      401,
    );
  },
);
test(
  "SEC-2 DB: vitrine e detalhe de sitter não expõem contato/endereço; hotel publica contato comercial",
  { skip },
  async () => {
    for (const role_id of [4, 3]) {
      const ctx = await publish(role_id);
      for (const path of [
        "/api/v1/providers/" + ctx.provider.id,
        "/api/v1/providers/" + (role_id === 4 ? "sitters" : "hotels"),
      ]) {
        const reply = await request(app).get(path);
        assert.equal(reply.status, 200);
        const value = Array.isArray(reply.body)
          ? reply.body.find((row) => row.id === ctx.provider.id)
          : reply.body;
        assert(value);
        for (const field of [
          "document",
          "document_type",
          "rejection_reason",
          "user_id",
          "sitter_evaluations",
        ])
          assert.equal(value[field], undefined);
        assert.deepEqual(Object.keys(value.user).sort(), [
          "avatar_url",
          "full_name",
          "role_id",
        ]);
        assert.equal(value.city, "São Paulo");
        for (const field of ["phone", "zip_code", "address_line"])
          if (role_id === 4) assert.equal(value[field], undefined);
          else assert(value[field]);
      }
    }
  },
);
test(
  "SEC-2 DB: contato do tutor é mínimo no agendamento e consulta alheia é recusada",
  { skip },
  async () => {
    const tutor = await actor(),
      stranger = await actor(),
      ctx = await publish(3),
      pet = await createPet(tutor.id);
    const service = await prisma.service.findFirst({
      where: { provider_id: ctx.provider.id },
    });
    const item = await prisma.appointment.create({
      data: {
        provider_id: ctx.provider.id,
        service_id: service.id,
        pet_id: pet.id,
        start_time: new Date("2027-01-01"),
        end_time: new Date("2027-01-02"),
        status: "CONFIRMADO",
        total_price: "100.00",
      },
    });
    for (const user of [tutor, ctx.partnerUser]) {
      const response = await request(app)
        .get("/api/v1/appointments/" + item.id)
        .set("Authorization", auth(user));
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(response.body.pet.tutor).sort(), [
        "email",
        "full_name",
        "id",
        "phone",
      ]);
      assert.equal(response.body.provider.document, undefined);
      assert.equal(response.body.provider.phone, "11999990000");
    }
    assert.equal(
      (
        await request(app)
          .get("/api/v1/appointments/" + item.id)
          .set("Authorization", auth(stranger))
      ).status,
      403,
    );
  },
);
test(
  "SEC-2 DB: perfil comercial valida nome/UF/CEP antes de escrever e tutor não altera vitrine",
  { skip },
  async () => {
    const ctx = await publish(3),
      tutor = await actor(),
      before = await prisma.provider.findUnique({
        where: { id: ctx.provider.id },
      });
    for (const data of [
      { business_name: " " },
      { state: "SPP" },
      { zip_code: "123" },
      { state: "XX" },
    ]) {
      const response = await request(app)
        .put("/api/v1/providers/me")
        .set("Authorization", auth(ctx.partnerUser))
        .send(data);
      assert.equal(response.status, 422);
      assert.equal(response.body.error.code, "VALIDATION_ERROR");
    }
    assert.deepEqual(
      await prisma.provider.findUnique({ where: { id: ctx.provider.id } }),
      before,
    );
    assert.equal(
      (
        await request(app)
          .put("/api/v1/providers/profile")
          .set("Authorization", auth(tutor))
          .send({ avatar_url: "https://example.test/should-not-save.png" })
      ).status,
      403,
    );
    assert.equal(
      (await prisma.user.findUnique({ where: { id: tutor.id } })).avatar_url,
      tutor.avatar_url,
    );
    const ok = await request(app)
      .put("/api/v1/providers/me")
      .set("Authorization", auth(ctx.partnerUser))
      .send({
        business_name: "Nome corrigido",
        zip_code: "01001-000",
        state: "sp",
      });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.state, "SP");
    assert.equal(ok.body.zip_code, "01001000");
  },
);
test(
  "SEC-2 DB: falha comercial reverte avatar em vez de salvar metade do perfil",
  { skip },
  async () => {
    const ctx = await publish(3),
      before = await prisma.user.findUnique({
        where: { id: ctx.partnerUser.id },
      });
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION qa_sec_fail_profile() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA_SEC_PROFILE_FAILURE'; END $$",
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_sec_fail_profile BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION qa_sec_fail_profile()",
    );
    try {
      await assert.rejects(
        updateProfile.execute(ctx.partnerUser.id, {
          avatar_url: "https://example.test/changed.png",
          description: "Alteração QA",
        }),
      );
      assert.equal(
        (await prisma.user.findUnique({ where: { id: ctx.partnerUser.id } }))
          .avatar_url,
        before.avatar_url,
      );
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_sec_fail_profile ON providers",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_sec_fail_profile()");
    }
  },
);
test(
  "SEC-2 DB: apenas sitter envia candidatura e admin não processa candidatura de outro perfil",
  { skip },
  async () => {
    const tutor = await actor(),
      admin = await actor(1),
      ctx = await createApprovedPartner({
        role_id: 4,
        sitterEvaluation: false,
      });
    const payload = {
      experience_details: "Experiência QA",
      environment_photos: [],
      quiz_answers: {},
    };
    assert.equal(
      (
        await request(app)
          .post("/api/v1/users/me/evaluations")
          .set("Authorization", auth(tutor))
          .send(payload)
      ).status,
      403,
    );
    const created = await request(app)
      .post("/api/v1/users/me/evaluations")
      .set("Authorization", auth(ctx.partnerUser))
      .send(payload);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const bad = await prisma.sitterEvaluation.create({
      data: { user_id: tutor.id, experience_details: "Legado inválido QA" },
    });
    const reply = await request(app)
      .patch("/api/v1/users/admin/evaluations/" + bad.id)
      .set("Authorization", auth(admin))
      .send({ status: "APPROVED" });
    assert.equal(reply.status, 422);
    assert.equal(
      (await prisma.sitterEvaluation.findUnique({ where: { id: bad.id } }))
        .status,
      "PENDING",
    );
  },
);

test(
  "SEC-2 DB: falha ao atualizar onboarding desfaz o envio da candidatura",
  { skip },
  async () => {
    const ctx = await createApprovedPartner({
      role_id: 4,
      sitterEvaluation: false,
    });
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION qa_sec_fail_onboarding() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA_SEC_ONBOARDING_FAILURE'; END $$",
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_sec_fail_onboarding BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION qa_sec_fail_onboarding()",
    );
    try {
      const response = await request(app)
        .post("/api/v1/users/me/evaluations")
        .set("Authorization", auth(ctx.partnerUser))
        .send({
          experience_details: "QA",
          environment_photos: [],
          quiz_answers: {},
        });
      assert.equal(response.status, 500);
      assert.equal(response.body.error.code, "INTERNAL_ERROR");
      assert.equal(
        await prisma.sitterEvaluation.count({
          where: { user_id: ctx.partnerUser.id },
        }),
        0,
      );
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_sec_fail_onboarding ON users",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_sec_fail_onboarding()");
    }
  },
);
