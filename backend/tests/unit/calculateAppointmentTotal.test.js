process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const calcular = require('../../src/useCases/appointments/CalculateAppointmentTotalUseCase');

// DEC-B: o preço vem do serviço; o papel do parceiro só define a unidade.
// As tarifas do perfil (daily_rate/hourly_rate) ficam diferentes de propósito.
const HOTEL = { daily_rate: 999, user: { role_id: 3 } };
const SITTER = { hourly_rate: 999, user: { role_id: 4 } };
const hotel = (price) => ({ service: { price }, provider: HOTEL });
const sitter = (price) => ({ service: { price }, provider: SITTER });

// Horários em -03:00 (fuso do negócio) para deixar explícito o dia de calendário.
const t = (iso) => new Date(`${iso}-03:00`);

// --- Hotel: preço do serviço × número de diárias (noites) ---

test('hotel: 1 diária quando entra e sai no mesmo dia (daycare)', () => {
  const r = calcular.execute({
    ...hotel(120),
    startTime: t('2026-10-10T08:00:00'),
    endTime: t('2026-10-10T18:00:00'),
  });
  assert.equal(r.quantity, 1);
  assert.equal(r.unit, 'DIARIA');
  assert.equal(r.total, 120);
});

test('hotel: 2 diárias entre os dias 10 e 12', () => {
  const r = calcular.execute({
    ...hotel(120),
    startTime: t('2026-10-10T14:00:00'),
    endTime: t('2026-10-12T10:00:00'),
  });
  assert.equal(r.quantity, 2);
  assert.equal(r.total, 240);
});

test('hotel: N diárias atravessando a virada de mês', () => {
  const r = calcular.execute({
    ...hotel(99.9),
    startTime: t('2026-10-29T12:00:00'),
    endTime: t('2026-11-02T12:00:00'),
  });
  assert.equal(r.quantity, 4);
  assert.equal(r.total, 399.6);
});

test('hotel: estadia que vira o dia à noite conta como diária, não como zero', () => {
  // Diferença bruta de 2 horas, mas são dois dias de calendário.
  const r = calcular.execute({
    ...hotel(120),
    startTime: t('2026-10-10T23:00:00'),
    endTime: t('2026-10-11T01:00:00'),
  });
  assert.equal(r.quantity, 1);
  assert.equal(r.total, 120);
});

test('hotel: aceita o Decimal do Prisma como string', () => {
  const r = calcular.execute({
    ...hotel('150.50'),
    startTime: t('2026-10-10T10:00:00'),
    endTime: t('2026-10-12T10:00:00'),
  });
  assert.equal(r.total, 301);
  assert.equal(r.unitPrice, 150.5);
});

test('hotel: o total segue o preço do serviço, não a diária do perfil (DEC-B)', () => {
  const periodo = { startTime: t('2026-10-10T14:00:00'), endTime: t('2026-10-12T10:00:00') };
  const simples = calcular.execute({ service: { price: 80 }, provider: HOTEL, ...periodo });
  const luxo = calcular.execute({ service: { price: 200 }, provider: HOTEL, ...periodo });

  assert.equal(simples.total, 160);
  assert.equal(simples.unitPrice, 80);
  assert.equal(luxo.total, 400);
  assert.notEqual(simples.total, HOTEL.daily_rate * 2);
});

// --- Sitter: hora iniciada conta inteira ---

test('sitter: 2 horas exatas', () => {
  const r = calcular.execute({
    ...sitter(40),
    startTime: t('2026-10-10T09:00:00'),
    endTime: t('2026-10-10T11:00:00'),
  });
  assert.equal(r.quantity, 2);
  assert.equal(r.unit, 'HORA');
  assert.equal(r.total, 80);
});

test('sitter: 90 minutos custam 2 horas (hora iniciada conta inteira)', () => {
  const r = calcular.execute({
    ...sitter(40),
    startTime: t('2026-10-10T09:00:00'),
    endTime: t('2026-10-10T10:30:00'),
  });
  assert.equal(r.quantity, 2);
  assert.equal(r.total, 80);
});

test('sitter: visita de 20 minutos cobra o mínimo de 1 hora', () => {
  const r = calcular.execute({
    ...sitter(40),
    startTime: t('2026-10-10T09:00:00'),
    endTime: t('2026-10-10T09:20:00'),
  });
  assert.equal(r.quantity, 1);
  assert.equal(r.total, 40);
});

test('sitter: o total segue o preço do serviço, não o valor/hora do perfil (DEC-B)', () => {
  const r = calcular.execute({
    service: { price: 35 },
    provider: SITTER,
    startTime: t('2026-10-10T09:00:00'),
    endTime: t('2026-10-10T12:00:00'),
  });
  assert.equal(r.total, 105);
  assert.equal(r.unitPrice, 35);
});

// --- Bordas e erros ---

test('rejeita fim anterior ou igual ao início', () => {
  for (const fim of ['2026-10-10T09:00:00', '2026-10-10T08:00:00']) {
    assert.throws(
      () => calcular.execute({
        ...hotel(120),
        startTime: t('2026-10-10T09:00:00'),
        endTime: t(fim),
      }),
      (err) => err.statusCode === 400
    );
  }
});

test('rejeita serviço sem preço', () => {
  for (const price of [null, 0, 'abc']) {
    assert.throws(
      () => calcular.execute({
        ...hotel(price),
        startTime: t('2026-10-10T09:00:00'),
        endTime: t('2026-10-11T09:00:00'),
      }),
      (err) => err.statusCode === 400 && /preço/.test(err.message)
    );
  }
});

test('rejeita chamada sem serviço', () => {
  assert.throws(
    () => calcular.execute({
      provider: HOTEL,
      startTime: t('2026-10-10T09:00:00'),
      endTime: t('2026-10-11T09:00:00'),
    }),
    (err) => err.statusCode === 400
  );
});

test('rejeita papel que não é hotel nem sitter', () => {
  assert.throws(
    () => calcular.execute({
      service: { price: 100 },
      provider: { user: { role_id: 2 } }, // lojista
      startTime: t('2026-10-10T09:00:00'),
      endTime: t('2026-10-11T09:00:00'),
    }),
    (err) => err.statusCode === 400 && /hotéis e pet sitters/i.test(err.message)
  );
});

test('rejeita datas inválidas', () => {
  assert.throws(
    () => calcular.execute({ ...hotel(120), startTime: 'nao-e-data', endTime: 'nem-isso' }),
    (err) => err.statusCode === 400
  );
});
