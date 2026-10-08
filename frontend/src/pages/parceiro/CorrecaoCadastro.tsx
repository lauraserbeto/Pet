import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import { providerService } from "../../lib/services/providerService";
import { PROVIDER_STATUS } from "../../lib/constants/providerStatus";
import { ApiError } from "../../lib/httpClient";

/**
 * Tela de correção de cadastro recusado (REC-2).
 *
 * É para onde o link do e-mail de recusa aponta — a URL está fixada no backend
 * como `${FRONTEND_URL}/parceiro/corrigir-cadastro`, então a rota não pode mudar
 * sem mudar o `ProviderController` junto.
 *
 * O link NÃO autentica: a proteção é por login (ver rota em app/routes.tsx).
 */

/** Campos que o `PUT /providers/me` aceita — mais do que isso é ignorado. */
type FormState = {
  business_name: string;
  phone: string;
  zip_code: string;
  address_line: string;
  city: string;
  state: string;
};

const CAMPOS: { name: keyof FormState; label: string; placeholder?: string }[] = [
  { name: "business_name", label: "Nome do negócio" },
  { name: "phone", label: "Telefone", placeholder: "(11) 90000-0000" },
  { name: "zip_code", label: "CEP", placeholder: "00000-000" },
  { name: "address_line", label: "Endereço" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "Estado", placeholder: "SP" },
];

const EMPTY_FORM: FormState = {
  business_name: "",
  phone: "",
  zip_code: "",
  address_line: "",
  city: "",
  state: "",
};

export default function CorrecaoCadastro() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const carregar = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const provider = await providerService.fetchMe();
      setStatus(provider?.status ?? null);
      setRejectionReason(provider?.rejection_reason ?? null);
      setForm({
        business_name: provider?.business_name ?? "",
        phone: provider?.phone ?? "",
        zip_code: provider?.zip_code ?? "",
        address_line: provider?.address_line ?? "",
        city: provider?.city ?? "",
        state: provider?.state ?? "",
      });
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar seu cadastro."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (name: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleReenviar = async () => {
    setIsSaving(true);
    try {
      // Duas chamadas de propósito: o endpoint de reenvio só troca o status,
      // não grava dados. Se o segundo passo falhar, as correções já estão
      // salvas e o usuário é avisado de que o reenvio não aconteceu.
      await providerService.updateMe(form);

      try {
        await providerService.resubmit();
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? `Correções salvas, mas o reenvio falhou: ${error.message}`
            : "Correções salvas, mas o reenvio falhou. Tente reenviar novamente."
        );
        return;
      }

      // Reflete o novo estado em tela, sem reload (alinhado ao fix da UX-2).
      setStatus(PROVIDER_STATUS.IN_REVIEW);
      setRejectionReason(null);
      toast.success("Cadastro reenviado para análise.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar as correções."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <HamsterLoader message="Carregando seu cadastro..." />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Algo deu errado</h1>
          <p className="text-slate-500 mt-2">{loadError}</p>
          <Button className="mt-6" onClick={carregar}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const estaRejeitado = status === PROVIDER_STATUS.REJECTED;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Corrigir cadastro</h1>
          <p className="text-slate-500 mt-2">
            Ajuste os dados apontados pela análise e reenvie para avaliação.
          </p>
        </div>

        {estaRejeitado ? (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
          >
            <div className="p-2 bg-red-100 rounded-xl text-red-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-800">Cadastro recusado</h2>
              <p className="text-sm text-red-700 mt-1">
                {rejectionReason || "Sem motivo especificado pelo administrador."}
              </p>
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
          >
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-800">
                Nenhuma recusa pendente
              </h2>
              <p className="text-sm text-emerald-700 mt-1">
                {status === PROVIDER_STATUS.IN_REVIEW
                  ? "Seu cadastro está em análise. Você será avisado assim que houver resposta."
                  : "Não há correção a fazer no momento."}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          {CAMPOS.map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                value={form[name]}
                placeholder={placeholder}
                disabled={!estaRejeitado || isSaving}
                onChange={(e) => handleChange(name, e.target.value)}
              />
            </div>
          ))}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/")} disabled={isSaving}>
              Voltar ao início
            </Button>
            <Button onClick={handleReenviar} disabled={!estaRejeitado || isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Reenviando..." : "Salvar e reenviar para análise"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
