import { LegalDocumentPage } from "../components/legal/LegalDocumentPage";
import { privacyDocument } from "../content/legal/privacy";

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      badge="Política de Privacidade"
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD."
      document={privacyDocument}
      colorScheme="secondary"
      crossLink={{ to: "/terms", label: "Ler os Termos de Uso" }}
    />
  );
}
