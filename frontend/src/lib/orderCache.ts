import type { QueryClient } from '@tanstack/react-query';
export function refreshOrderHistory(client: QueryClient, userId?: string) {
  return client.invalidateQueries({ queryKey: userId ? ['tutor-orders', userId] : ['tutor-orders'] });
}
