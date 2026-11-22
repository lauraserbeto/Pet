export type DocumentType = "CPF" | "CNPJ";
export const normalizeDocument = (value: string) => value.replace(/[\s./-]/g, "").toUpperCase();
function digit(value: string, weights: number[]) {
  const rest =
    [...value].reduce((sum, char, i) => sum + (char.charCodeAt(0) - 48) * weights[i], 0) % 11;
  return rest < 2 ? "0" : String(11 - rest);
}
export function isValidDocument(value: string, type: DocumentType) {
  const document = normalizeDocument(value);
  if (type === "CPF") {
    if (!/^\d{11}$/.test(document) || /^(\d)\1{10}$/.test(document)) return false;
    const first = digit(document.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return (
      document.slice(-2) ===
      first + digit(document.slice(0, 9) + first, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
    );
  }
  if (!/^[A-Z0-9]{12}\d{2}$/.test(document) || /^(\d)\1{13}$/.test(document)) return false;
  const first = digit(document.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return (
    document.slice(-2) ===
    first + digit(document.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}
