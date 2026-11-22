import { z } from "zod";
export const passwordChecks = [
  { label: "Mínimo 8 caracteres", test: (password: string) => password.length >= 8 },
  { label: "Uma letra maiúscula", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Um número", test: (password: string) => /\d/.test(password) },
];
export const newPasswordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/\d/, "A senha deve conter ao menos um número")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Senha muito longa. Reduza a quantidade de caracteres."
  );
