import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { ReviewComposer } from "./ReviewComposer";
import { ReviewsPanel } from "./ReviewsPanel";
import { RatingBadge } from "./RatingBadge";
import { reviewService, type Review } from "../../lib/services/reviewService";
import { ApiError } from "../../lib/httpClient";

const auth = vi.hoisted(() => ({ user: { id: "tutor", role_id: 5 }, token: "test" }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth }));
const origin = { product_id: "product", order_id: "order" };
const review: Review = {
  id: "r",
  rating: 5,
  comment: "<b>Ótimo produto</b>",
  created_at: "2026-11-18T10:00:00Z",
  author: { id: "tutor", full_name: "Laura Teste" },
};
let client: QueryClient;
function display(element = <ReviewComposer completed label="Ração" origin={origin} />) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>
  );
}
async function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Avaliar Ração" }));
  await screen.findByRole("radio", { name: "5 estrelas" });
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Enviar avaliação" }) as HTMLButtonElement).disabled
    ).toBe(false)
  );
}
beforeEach(() => {
  auth.user = { id: "tutor", role_id: 5 };
  vi.spyOn(reviewService, "mine").mockResolvedValue({ review: null });
  vi.spyOn(reviewService, "create").mockResolvedValue({ review });
  vi.spyOn(reviewService, "summary").mockResolvedValue({
    rating_avg: 4.6,
    rating_count: 15,
    distribution: [
      { rating: 5, count: 12 },
      { rating: 4, count: 0 },
      { rating: 3, count: 3 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ],
  });
  vi.spyOn(reviewService, "list").mockResolvedValue({ data: [review], total: 15, pages: 3 });
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
});

test("não oferece avaliação antes de concluir nem a outro perfil", () => {
  const rendered = display(<ReviewComposer completed={false} label="Ração" origin={origin} />);
  expect(screen.queryByRole("button")).toBeNull();
  auth.user = { id: "partner", role_id: 3 };
  rendered.rerender(
    <QueryClientProvider client={client}>
      <ReviewComposer completed label="Ração" origin={origin} />
    </QueryClientProvider>
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(reviewService.mine).not.toHaveBeenCalled();
});
test("envia uma vez, invalida os agregados e apresenta a avaliação salva", async () => {
  display();
  client.setQueryDefaults(["public-product"], { gcTime: Infinity });
  client.setQueryData(["public-product", "product"], { rating_count: 0 });
  await openForm();
  fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
  fireEvent.change(screen.getByLabelText("Comentário (opcional)"), {
    target: { value: "  Excelente  " },
  });
  const send = screen.getByRole("button", { name: "Enviar avaliação" });
  fireEvent.click(send);
  fireEvent.click(send);
  await screen.findByText("Avaliação enviada com sucesso.");
  expect(reviewService.create).toHaveBeenCalledTimes(1);
  expect(reviewService.create).toHaveBeenCalledWith(origin, { rating: 5, comment: "Excelente" });
  expect(screen.getByText("<b>Ótimo produto</b>").querySelector("b")).toBeNull();
  expect(client.getQueryState(["public-product", "product"])?.isInvalidated).toBe(true);
});
test("nota é obrigatória", async () => {
  display();
  await openForm();
  fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));
  await screen.findByText("Escolha uma nota.");
  expect(reviewService.create).not.toHaveBeenCalled();
});
test("consulta persistida impede novo formulário após recarregar", async () => {
  vi.mocked(reviewService.mine).mockResolvedValue({ review });
  display();
  fireEvent.click(screen.getByRole("button", { name: "Avaliar Ração" }));
  await screen.findByText("Você já avaliou este item.");
  expect(screen.queryByRole("button", { name: "Enviar avaliação" })).toBeNull();
});
test("erro 422 mantém os dados e explica a recusa do servidor", async () => {
  vi.mocked(reviewService.create).mockRejectedValue(
    new ApiError(422, "VALIDATION_ERROR", "Pedido ainda não concluído")
  );
  display();
  await openForm();
  fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
  fireEvent.change(screen.getByLabelText("Comentário (opcional)"), {
    target: { value: "Minha experiência" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));
  await screen.findByText("Pedido ainda não concluído");
  expect(screen.getByLabelText("Comentário (opcional)")).toHaveProperty(
    "value",
    "Minha experiência"
  );
});
test("timeout bloqueia reenvio e permite conferir o registro salvo", async () => {
  vi.mocked(reviewService.create).mockRejectedValue(new ApiError(0, "TIMEOUT", "Tempo esgotado"));
  display();
  await openForm();
  fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));
  await screen.findByText(/O envio pode ter sido concluído/);
  expect(screen.getByRole("button", { name: "Enviar avaliação" })).toHaveProperty("disabled", true);
  vi.mocked(reviewService.mine).mockResolvedValue({ review });
  fireEvent.click(screen.getByRole("button", { name: "Verificar envio" }));
  await screen.findByText("Você já avaliou este item.");
  expect(reviewService.create).toHaveBeenCalledTimes(1);
});
test("409 recupera avaliação existente e não repete o POST", async () => {
  vi.mocked(reviewService.mine)
    .mockResolvedValueOnce({ review: null })
    .mockResolvedValue({ review });
  vi.mocked(reviewService.create).mockRejectedValue(new ApiError(409, "CONFLICT", "Já avaliado"));
  display();
  await openForm();
  fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));
  await screen.findByText("Você já avaliou este item.");
  expect(reviewService.create).toHaveBeenCalledTimes(1);
});
test("falha na consulta inicial bloqueia escrita e oferece retry", async () => {
  vi.mocked(reviewService.mine).mockRejectedValueOnce(new Error("offline"));
  display();
  fireEvent.click(screen.getByRole("button", { name: "Avaliar Ração" }));
  await screen.findByText("Não foi possível conferir sua avaliação.");
  expect(screen.queryByRole("button", { name: "Enviar avaliação" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByRole("radio", { name: "5 estrelas" });
});
test("lista usa paginação do servidor e distribuição do conjunto completo", async () => {
  vi.mocked(reviewService.list).mockImplementation(async (_target, page) => ({
    data: [
      { ...review, id: String(page), author: { id: String(page), full_name: `Autor ${page}` } },
    ],
    total: 15,
    pages: 3,
  }));
  display(<ReviewsPanel target={{ product_id: "product" }} />);
  await screen.findByText("Autor 1");
  expect(screen.getByText("(15 avaliações)")).toBeTruthy();
  expect(screen.getByRole("meter", { name: "5 estrelas" })).toHaveProperty("value", 12);
  fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
  await screen.findByText("Autor 2");
  expect(screen.queryByText("Autor 1")).toBeNull();
  expect(screen.getByText("Página 2 de 3")).toBeTruthy();
});
test("erro em nova página mantém navegação e retry", async () => {
  vi.mocked(reviewService.list)
    .mockResolvedValueOnce({ data: [review], total: 15, pages: 3 })
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ data: [review], total: 15, pages: 3 });
  display(<ReviewsPanel target={{ provider_id: "partner" }} />);
  await screen.findByText("Laura Teste");
  fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
  await screen.findByText("Não foi possível carregar esta página de avaliações.");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Laura Teste");
  expect(screen.getByText("Página 2 de 3")).toBeTruthy();
});
test("estado vazio não inventa estrelas nem distribuição", async () => {
  vi.mocked(reviewService.summary).mockResolvedValue({
    rating_avg: null,
    rating_count: 0,
    distribution: [],
  });
  vi.mocked(reviewService.list).mockResolvedValue({ data: [], total: 0, pages: 0 });
  display(<ReviewsPanel target={{ product_id: "product" }} />);
  await screen.findByText("Ainda sem avaliações");
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("meter")).toBeNull();
  // G18: sem paginação inútil e sem repetir o aviso de vazio do resumo.
  await waitFor(() => expect(screen.queryByText(/Carregando avaliações/)).toBeNull());
  expect(screen.queryByRole("navigation", { name: "Paginação de avaliações" })).toBeNull();
  expect(screen.queryByText("Este item ainda não recebeu avaliações.")).toBeNull();
});
test("resumo ausente não vira nota fictícia", () => {
  display(<RatingBadge />);
  expect(screen.getByText("Avaliações indisponíveis")).toBeTruthy();
  expect(screen.queryByRole("img")).toBeNull();
});
