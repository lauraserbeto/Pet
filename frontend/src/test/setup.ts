import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Desmonta a árvore React entre os testes para evitar vazamento de DOM.
afterEach(() => cleanup());
