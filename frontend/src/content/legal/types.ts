import type { LucideIcon } from "lucide-react";

export type LegalSection = {
  /** Vira o `id` da seção no DOM — permite deep-link (ex.: /terms#pagamentos). */
  id: string;
  icon: LucideIcon;
  title: string;
  /**
   * Texto do documento. Convenções aceitas pelo renderizador de
   * `LegalDocumentPage`: parágrafos separados por linha em branco,
   * itens de lista iniciados por "•" e trechos em negrito com **asteriscos**.
   */
  content: string;
};

export type LegalDocument = {
  lastUpdated: string;
  sections: LegalSection[];
};
