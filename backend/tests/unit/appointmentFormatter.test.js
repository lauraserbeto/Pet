const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatAppointment,
  formatAppointments,
  asNumber,
  sanitizeUser,
  toAppointmentTutor,
} = require('../../src/utils/appointmentFormatter');

test('asNumber converte valores numéricos, strings e objetos com .toNumber()', () => {
  assert.equal(asNumber(null), null);
  assert.equal(asNumber(undefined), null);
  assert.equal(asNumber(120), 120);
  assert.equal(asNumber('150.50'), 150.5);
  assert.equal(
    asNumber({
      toNumber() {
        return 200;
      },
    }),
    200
  );
});

test('sanitizeUser remove password_hash preservando os demais campos', () => {
  assert.equal(sanitizeUser(null), null);
  const user = {
    id: 'user-1',
    name: 'João Tutor',
    email: 'joao@example.com',
    password_hash: '$2b$10$xyz...',
  };
  const sanitized = sanitizeUser(user);
  assert.equal(sanitized.id, 'user-1');
  assert.equal(sanitized.name, 'João Tutor');
  assert.equal(sanitized.email, 'joao@example.com');
  assert.equal('password_hash' in sanitized, false);
});

test('formatAppointment remove dados sensíveis do provider e do tutor e converte Decimais', () => {
  const raw = {
    id: 'appt-123',
    provider_id: 'provider-1',
    service_id: 'service-1',
    pet_id: 'pet-1',
    start_time: '2026-11-10T14:00:00Z',
    end_time: '2026-11-12T10:00:00Z',
    status: 'CONFIRMADO',
    payment_policy: 'PRE_PAGO',
    total_price: {
      toNumber() {
        return 240;
      },
    },
    notes: 'Cuidados especiais',
    created_at: new Date('2026-11-01T10:00:00Z'),
    updated_at: new Date('2026-11-01T10:00:00Z'),
    pet: {
      id: 'pet-1',
      name: 'Rex',
      tutor: {
        id: 'tutor-1',
        name: 'Maria',
        password_hash: 'hash-secreto',
      },
    },
    service: {
      id: 'service-1',
      name: 'Hospedagem Canina',
      price: '120.00',
    },
    provider: {
      id: 'provider-1',
      business_name: 'Hotel Patinhas',
      document: '12345678000199',
      document_type: 'CNPJ',
      rejection_reason: 'Motivo interno',
      daily_rate: '120.00',
      hourly_rate: null,
      user: {
        id: 'provider-user-1',
        password_hash: 'hash-parceiro',
      },
    },
    refund: {
      status: 'ESTORNADO',
      simulated: true,
      amount: 240,
    },
  };

  const formatted = formatAppointment(raw);

  assert.equal(formatted.id, 'appt-123');
  assert.equal(formatted.payment_policy, 'PRE_PAGO');
  assert.equal(typeof formatted.total_price, 'number');
  assert.equal(formatted.total_price, 240);
  assert.equal(typeof formatted.service.price, 'number');
  assert.equal(formatted.service.price, 120);
  assert.equal(typeof formatted.provider.daily_rate, 'number');
  assert.equal(formatted.provider.daily_rate, 120);

  // Sem vazamento sensível
  assert.equal('password_hash' in formatted.pet.tutor, false);
  assert.equal('password_hash' in formatted.provider.user, false);
  assert.equal('document' in formatted.provider, false);
  assert.equal('document_type' in formatted.provider, false);
  assert.equal('rejection_reason' in formatted.provider, false);

  // Refund preservado
  assert.deepEqual(formatted.refund, {
    status: 'ESTORNADO',
    simulated: true,
    amount: 240,
  });
});

test('tutor do agendamento sai só com id, nome, telefone e e-mail (AUD-17)', () => {
  const tutor = {
    id: 'tutor-1',
    full_name: 'Maria Tutora',
    phone: '(11) 99999-0000',
    email: 'maria@example.com',
    password_hash: 'hash',
    avatar_url: 'data:image/png;base64,AAAA',
    is_active: true,
    role_id: 5,
  };

  assert.deepEqual(toAppointmentTutor(tutor), {
    id: 'tutor-1',
    full_name: 'Maria Tutora',
    phone: '(11) 99999-0000',
    email: 'maria@example.com',
  });
  assert.equal(toAppointmentTutor(null), null);

  const formatted = formatAppointment({ id: 'appt-1', total_price: '10', pet: { id: 'pet-1', tutor } });
  assert.deepEqual(Object.keys(formatted.pet.tutor).sort(), ['email', 'full_name', 'id', 'phone']);
});

test('agendamento sem política gravada sai com payment_policy null', () => {
  assert.equal(formatAppointment({ id: 'appt-1', total_price: '10' }).payment_policy, null);
});

test('formatAppointments lida com array vazio ou nulo com segurança', () => {
  assert.deepEqual(formatAppointments([]), []);
  assert.deepEqual(formatAppointments(null), []);
  assert.deepEqual(formatAppointments(undefined), []);
  assert.equal(formatAppointment(null), null);
});
