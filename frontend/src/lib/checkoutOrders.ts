export const orderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function checkoutOrderIds(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50 || raw.some(id => typeof id !== 'string' || !orderUuid.test(id))) return [];
  return [...new Set(raw)];
}
export function checkoutSuccessUrl(ids: string[]) {
  return '/checkout/success?' + new URLSearchParams({ orders: ids.join(',') });
}
