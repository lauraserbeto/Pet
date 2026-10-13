import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, PackagePlus, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import { useServices } from "../../lib/hooks/useServices";
import {
  BILLING_UNIT_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  type ServiceCategory,
} from "../../lib/services/serviceService";
import { providerService } from "../../lib/services/providerService";
import {
  PAYMENT_POLICY,
  PAYMENT_POLICY_DESCRIPTIONS,
  PAYMENT_POLICY_LABELS,
  normalizePaymentPolicy,
  type PaymentPolicy,
} from "../../lib/constants/paymentPolicy";
import { ApiError } from "../../lib/httpClient";

/**
 * Gestão de serviços do parceiro (SRV-F1 — parte 1: criar e listar).
 *
 * Editar e excluir ficam para a SRV-F2; o `useServices` já expõe as mutations.
 *
 * A unidade de cobrança (diária/hora) NÃO é decidida aqui: vem no
 * `billing_unit` que o backend deriva do papel do parceiro.
 */

const formSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço").max(150, "Máximo de 150 caracteres"),
  category: z.enum(SERVICE_CATEGORIES, { message: "Escolha uma categoria" }),
  // String porque o backend aceita "R$ 1.234,56" e normaliza; aqui só barramos
  // valor ausente ou não-positivo.
  price: z
    .string()
    .trim()
    .min(1, "Informe o preço")
    .refine((v) => {
      const n = Number(v.replace(/^R\$\s*/i, "").replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) && n > 0;
    }, "O preço deve ser maior que zero"),
  description: z.string().trim().max(5000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function Services() {
  const { services, isLoading, error, refetch, createService, isCreating } = useServices();

  const [paymentPolicy, setPaymentPolicy] = useState<PaymentPolicy | null>(null);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", price: "", description: "" },
  });

  useEffect(() => {
    providerService
      .fetchMe()
      .then((provider) => setPaymentPolicy(normalizePaymentPolicy(provider?.payment_policy)))
      .catch(() => setPaymentPolicy(null));
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      await createService({
        name: values.name,
        category: values.category,
        price: values.price,
        description: values.description || null,
      });
      toast.success(`"${values.name}" foi criado.`);
      reset({ name: "", price: "", description: "" });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível criar o serviço."
      );
    }
  };

  const handlePolicyChange = async (value: string) => {
    const anterior = paymentPolicy;
    const novo = normalizePaymentPolicy(value);
    setPaymentPolicy(novo);
    setIsSavingPolicy(true);
    try {
      await providerService.updateMe({ payment_policy: novo });
      toast.success("Política de cobrança atualizada.");
    } catch (err) {
      setPaymentPolicy(anterior); // desfaz: o valor não foi persistido
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível salvar a política de cobrança."
      );
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const categoriaSelecionada = watch("category");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
          Meus Serviços
        </h2>
        <p className="text-slate-500 mt-1">
          Cadastre o que você oferece e defina como quer receber.
        </p>
      </div>

      {/* Política de cobrança */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-slate-800">Política de cobrança</h3>
              <p className="text-sm text-slate-500">
                Vale para todos os seus agendamentos.
              </p>
            </div>

            {paymentPolicy === null ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : (
              <div className="space-y-2 max-w-md">
                <Select
                  value={paymentPolicy}
                  onValueChange={handlePolicyChange}
                  disabled={isSavingPolicy}
                >
                  <SelectTrigger aria-label="Política de cobrança">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PAYMENT_POLICY).map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {PAYMENT_POLICY_LABELS[policy]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {PAYMENT_POLICY_DESCRIPTIONS[paymentPolicy]}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Criação */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-[var(--color-primary-500)]" />
          Novo serviço
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do serviço</Label>
              <Input id="name" placeholder="Hospedagem com passeio diário" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Tipo</Label>
              <Select
                value={categoriaSelecionada}
                onValueChange={(v) => setValue("category", v as ServiceCategory, { shouldValidate: true })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Escolha o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SERVICE_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input id="price" placeholder="R$ 120,00" {...register("price")} />
              {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar serviço"}
            </Button>
          </div>
        </form>
      </section>

      {/* Listagem */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[var(--color-primary-500)]" />
          Serviços cadastrados
        </h3>

        {isLoading ? (
          <HamsterLoader size="sm" message="Carregando seus serviços..." />
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-slate-500">
              {error instanceof ApiError ? error.message : "Não foi possível carregar os serviços."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl">
            <p className="text-slate-800 font-medium">Nenhum serviço cadastrado ainda</p>
            <p className="text-slate-500 text-sm mt-1">
              Crie o primeiro acima para aparecer na sua vitrine.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {services.map((service) => (
              <li key={service.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">{service.name}</p>
                  <p className="text-sm text-slate-500">
                    {SERVICE_CATEGORY_LABELS[service.category] ?? service.category}
                  </p>
                  {service.description && (
                    <p className="text-sm text-slate-400 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-800">{formatCurrency(service.price)}</p>
                  <p className="text-xs text-slate-500">
                    {BILLING_UNIT_LABELS[service.billing_unit] ?? service.billing_unit}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
