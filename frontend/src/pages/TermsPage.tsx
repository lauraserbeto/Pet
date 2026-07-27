import { LegalDocumentPage } from "../components/legal/LegalDocumentPage";
import { termsDocument } from "../content/legal/terms";

export function TermsPage() {
  return (
    <LegalDocumentPage
      badge="Termos de Uso"
      title="Termos de Uso"
      subtitle="As regras que orientam o uso da plataforma Pet+ por tutores e parceiros."
      document={termsDocument}
      colorScheme="primary"
      crossLink={{ to: "/privacy", label: "Ler a Política de Privacidade" }}
    />
  );
}
