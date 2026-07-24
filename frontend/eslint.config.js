import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

// Adoção de lint em codebase existente: erros só para problemas reais
// (regras de hooks, bugs). Ruído estilístico/legado fica em "warn" para não
// travar o CI — o time sobe o rigor gradualmente.
export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "src/imports/**", // componentes gerados (Figma)
      "src/app/components/ui/**", // biblioteca de UI (shadcn) vendorizada
      "src/components/ui/**",
      "**/*.config.{js,ts}",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Só a regra clássica de hooks é erro (bug real). As regras do React
      // Compiler (immutability etc.) são estritas demais para o código atual.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "off",
      // Ruído legado → warn (não bloqueia; visível para correção incremental).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-case-declarations": "warn",
      "prefer-const": "warn",
    },
  },
  prettier
);
