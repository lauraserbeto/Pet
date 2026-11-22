import { Button } from '../ui/button';

export function OrdersPagination({ page, totalPages, total, busy, onPage }: {
  page: number; totalPages: number; total: number; busy: boolean;
  onPage: (page: number) => void;
}) {
  return <nav aria-label="Paginação de pedidos" className="flex flex-wrap items-center justify-between gap-3 p-4">
    <p role="status" className="text-sm text-slate-600">{total} pedidos · Página {page} de {Math.max(1, totalPages)}</p>
    <div className="flex gap-2">
      <Button variant="outline" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>Página anterior</Button>
      <Button variant="outline" disabled={busy || page >= totalPages} onClick={() => onPage(page + 1)}>Próxima página</Button>
    </div>
  </nav>;
}
