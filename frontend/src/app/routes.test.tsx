import { afterAll, expect, it } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { rootRoutes, router } from "./routes";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

afterAll(() => router.dispose());
const dashboard = rootRoutes.find((route) => route.path === "/dashboard")!;
const publicRoot = rootRoutes.find((route) => route.path === "/")!;
const props = (element: ReactNode) => {
  if (!isValidElement<{ allowedRoles?: readonly number[]; children?: ReactNode }>(element))
    throw Error("Rota sem elemento protegido");
  expect(element.type).toBe(ProtectedRoute);
  return element.props;
};

it.each([
  ["", [1, 2, 3, 4]],
  ["conta", [1, 2, 3, 4]],
  ["perfil", [2, 3, 4]],
  ["schedule", [3, 4]],
  ["servicos", [3, 4]],
  ["financeiro", [2, 3, 4]],
  ["products", [2]],
  ["orders", [2]],
  ["customers", [2, 3, 4]],
  ["settings", [1]],
  ["aprovacoes", [1]],
  ["usuarios", [1]],
  ["avaliacoes-sitters", [1]],
])("rota real do painel /dashboard/%s declara seus papéis", (path, roles) => {
  const route = dashboard.children!.find((route) =>
    path === "" ? route.index : route.path === path
  )!;
  expect(props(route.element).allowedRoles).toEqual(roles);
});

it.each([
  "tutor/perfil",
  "tutor/pets",
  "tutor/agendamentos",
  "tutor/pedidos",
  "tutor/agendar/:providerId",
])("rota real %s é exclusiva do tutor", (path) => {
  expect(
    props(publicRoot.children!.find((route) => route.path === path)!.element).allowedRoles
  ).toEqual([5]);
});

it("onboarding real é exclusivo do sitter", () => {
  const route = rootRoutes.find((route) => route.path === "/onboarding/sitter")!;
  expect(isValidElement<{ children: ReactNode }>(route.element)).toBe(true);
  if (isValidElement<{ children: ReactNode }>(route.element))
    expect(props(route.element.props.children).allowedRoles).toEqual([4]);
});
