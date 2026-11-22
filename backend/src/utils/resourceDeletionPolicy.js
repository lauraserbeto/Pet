const {
  normalizeAppointmentStatus,
  isAppointmentTerminalStatus,
} = require("../constants/appointmentStatus");
const {
  normalizeOrderStatus,
  isOrderTerminalStatus,
} = require("../constants/orderStatus");
// Estado desconhecido não comprova conclusão. Compatibilidade usa os aliases
// oficiais, sem manter outra lista de literais legados nos controllers.
const blocksPetRemoval = (status) =>
  !isAppointmentTerminalStatus(normalizeAppointmentStatus(status));
const blocksLastAddressRemoval = (status) =>
  !isOrderTerminalStatus(normalizeOrderStatus(status));
module.exports = { blocksPetRemoval, blocksLastAddressRemoval };
