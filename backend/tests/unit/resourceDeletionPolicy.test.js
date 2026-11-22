const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  blocksPetRemoval,
  blocksLastAddressRemoval,
} = require("../../src/utils/resourceDeletionPolicy");
test("E-12: pet não pode ser removido com atendimento ativo, inclusive pré-pago aguardando confirmação", () => {
  for (const state of [
    "PENDENTE",
    "AGUARDANDO_CONFIRMACAO",
    "CONFIRMADO",
    " pending ",
    "CONFIRMED",
    "AWAITING_CONFIRMATION",
    null,
    "DESCONHECIDO",
  ])
    assert(blocksPetRemoval(state));
  for (const state of [
    "CONCLUIDO",
    "RECUSADO",
    "CANCELADO",
    " completed ",
    "REJECTED",
    "CANCELED",
  ])
    assert(!blocksPetRemoval(state));
});
test("E-12: último endereço só libera com pedidos terminais reconhecidos", () => {
  for (const state of [
    "AGUARDANDO_PAGAMENTO",
    "PAGO",
    "PREPARANDO",
    "ENVIADO",
    "pending",
    " paid ",
    "SHIPPED",
    "DESCONHECIDO",
    null,
  ])
    assert(blocksLastAddressRemoval(state));
  for (const state of [
    "CONCLUIDO",
    "CANCELADO",
    " delivered ",
    "COMPLETED",
    "CANCELED",
  ])
    assert(!blocksLastAddressRemoval(state));
});
