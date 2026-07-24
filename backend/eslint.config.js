const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

// Adoção de lint em codebase existente: erros só para problemas reais;
// ruído legado fica em "warn" para não travar o CI.
module.exports = [
  { ignores: ["node_modules", "prisma/migrations/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-empty": "warn",
      "prefer-const": "warn",
    },
  },
  prettier,
];
