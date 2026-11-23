import { expect, it } from "vitest";
import vercel from "../../vercel.json";
import { PRODUCTION_API_ORIGIN, buildCsp } from "./csp";

// E-35: a CSP de produção (vercel.json) é a mesma gerada por buildCsp e é EFETIVA.
const headers: Array<{ key: string; value: string }> = vercel.headers.flatMap((h) => h.headers);

it("vercel.json serve a CSP efetiva gerada por buildCsp com a API de produção", () => {
  expect(headers.some((h) => h.key === "Content-Security-Policy-Report-Only")).toBe(false);
  const csp = headers.find((h) => h.key === "Content-Security-Policy");
  expect(csp?.value).toBe(buildCsp(PRODUCTION_API_ORIGIN));
});

it("política não libera eval, scripts externos, plugins nem enquadramento", () => {
  const csp = buildCsp(PRODUCTION_API_ORIGIN);
  const script = csp.split("; ").find((d) => d.startsWith("script-src"));
  expect(script).toBe("script-src 'self'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'self'");
  // Prévia local das fotos do onboarding usa blob:.
  expect(csp).toMatch(/img-src [^;]*blob:/);
});

