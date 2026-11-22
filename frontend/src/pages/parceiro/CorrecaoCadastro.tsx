import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../contexts/AuthContext";

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

// Mesmas UFs e limites aceitos por updateProviderAccountSchema na API.
const UFS = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ")
);
type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateCorrection(form: FormState) {
  const data = {
    ...form,
    business_name: form.business_name.trim(),
    state: form.state.trim().toUpperCase(),
    zip_code: form.zip_code.trim(),
  };
  const errors: FieldErrors = {};
  if (data.business_name.length < 2 || data.business_name.length > 150)
    errors.business_name = "Informe um nome de negócio entre 2 e 150 caracteres.";
  if (data.state && !UFS.has(data.state)) errors.state = "Selecione uma UF válida, como SP ou GO.";
  if (data.zip_code && !/^\d{5}-?\d{3}$/.test(data.zip_code))
    errors.zip_code = "Informe um CEP válido.";
  for (const [field, max, label] of [
    ["phone", 20, "Telefone"],
    ["address_line", 255, "Endereço"],
    ["city", 100, "Cidade"],
  ] as const) {
    if (data[field].length > max) errors[field] = `${label} deve ter no máximo ${max} caracteres.`;
  }
  data.zip_code = data.zip_code.replace("-", "");
  return { data, errors };
}

export default function CorrecaoCadastro() {
  const navigate = useNavigate();
  const { refetchMe } = useAuth();
  const saving = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        error instanceof ApiError ? error.message : "Não foi possível carregar seu cadastro."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleReenviar = async () => {
    if (saving.current || status !== PROVIDER_STATUS.REJECTED) return;
    setSubmitError(null);
    const { data, errors } = validateCorrection(form);
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    saving.current = true;
    setIsSaving(true);
    try {
      // Duas chamadas de propósito: o endpoint de reenvio só troca o status,
      // não grava dados. Se o segundo passo falhar, as correções já estão
      // salvas e o usuário é avisado de que o reenvio não aconteceu.
      await providerService.updateMe(data);

      try {
        await providerService.resubmit();
      } catch (error) {
        const message =
          error instanceof ApiError
            ? `Correções salvas, mas o reenvio falhou: ${error.message}`
            : "Correções salvas, mas o reenvio falhou. Tente reenviar novamente.";
        setSubmitError(message);
        toast.error(message);
        return;
      }

      // Reflete o novo estado em tela, sem reload (alinhado ao fix da UX-2).
      setStatus(PROVIDER_STATUS.IN_REVIEW);
      setRejectionReason(null);
      toast.success("Cadastro reenviado para análise.");
      // Atualiza o estado de aprovação da sessão, não apenas este formulário.
      // refetchMe preserva a sessão se a leitura falhar; não repete o reenvio.
      await refetchMe();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Não foi possível salvar as correções.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      saving.current = false;
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
              <h2 className="text-sm font-bold text-emerald-800">Nenhuma recusa pendente</h2>
              <p className="text-sm text-emerald-700 mt-1">
                {status === PROVIDER_STATUS.IN_REVIEW
                  ? "Seu cadastro está em análise. Você será avisado assim que houver resposta."
                  : "Não há correção a fazer no momento."}
              </p>
            </div>
          </div>
        )}

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleReenviar();
          }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
        >
          {submitError && (
            <p role="alert" className="text-sm text-red-700">
              {submitError}
            </p>
          )}
          {CAMPOS.map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                value={form[name]}
                placeholder={placeholder}
                disabled={!estaRejeitado || isSaving}
                aria-invalid={Boolean(fieldErrors[name])}
                aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
                onChange={(e) => handleChange(name, e.target.value)}
              />
              {fieldErrors[name] && (
                <p id={`${name}-error`} className="text-sm text-red-700">
                  {fieldErrors[name]}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              disabled={isSaving}
            >
              Voltar ao início
            </Button>
            <Button type="submit" disabled={!estaRejeitado || isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Reenviando..." : "Salvar e reenviar para análise"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
