import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Plus, Edit2, Trash2, Loader2, Star, CheckCircle2 } from "lucide-react";
import { HamsterLoader } from "../ui/HamsterLoader";
import { ApiError } from "../../lib/httpClient";
import { useAddresses } from "../../lib/hooks/useAddresses";
import { useCepLookup } from "../../lib/hooks/useCepLookup";
import type { Address } from "../../lib/services/addressService";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR",
  "SC", "SP", "SE", "TO",
] as const;

const addressSchema = z.object({
  cep: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (00000-000)"),
  rua: z.string().trim().min(2, "Rua é obrigatória").max(255),
  numero: z.string().trim().min(1, "Número é obrigatório").max(20),
  complemento: z.string().trim().max(255).optional().or(z.literal("")),
  bairro: z.string().trim().min(2, "Bairro é obrigatório").max(100),
  cidade: z.string().trim().min(2, "Cidade é obrigatória").max(100),
  estado: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => (UF_LIST as readonly string[]).includes(v), "UF inválida"),
});

type AddressForm = z.infer<typeof addressSchema>;

const EMPTY: AddressForm = {
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function AddressesSection() {
  const {
    addresses,
    isLoading,
    createAddress,
    isCreating,
    updateAddress,
    isUpdating,
    setDefault,
    removeAddress,
  } = useAddresses();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isFetchingCep, lookupCep } = useCepLookup();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  });

  const cepValue = watch("cep");

  // Auto-fill via ViaCEP no blur do CEP
  useEffect(() => {
    const cleaned = (cepValue || "").replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    void (async () => {
      const result = await lookupCep(cleaned);
      if (result) {
        if (result.address_line) setValue("rua", result.address_line, { shouldValidate: true });
        if (result.city) setValue("cidade", result.city, { shouldValidate: true });
        if (result.state) setValue("estado", result.state, { shouldValidate: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue]);

  const openCreate = () => {
    reset(EMPTY);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    reset({
      cep: addr.cep,
      rua: addr.rua,
      numero: addr.numero,
      complemento: addr.complemento ?? "",
      bairro: addr.bairro,
      cidade: addr.cidade,
      estado: addr.estado,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset(EMPTY);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingId) {
        await updateAddress({ id: editingId, payload: values });
        toast.success("Endereço atualizado!");
      } else {
        await createAddress(values);
        toast.success("Endereço adicionado!");
      }
      closeForm();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao salvar endereço.";
      toast.error(message);
    }
  });

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault(id);
      toast.success("Endereço definido como principal");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao alterar endereço principal";
      toast.error(message);
    }
  };

  const handleDelete = async (addr: Address) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    try {
      await removeAddress(addr.id);
      toast.success("Endereço excluído!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao excluir endereço.";
      toast.error(message);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 font-[family-name:var(--font-display)]">
            <MapPin className="w-5 h-5 text-[var(--color-primary-500)]" />
            Meus Endereços
          </h2>
          {!showForm && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Endereço
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={onSubmit}
            className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CEP {isFetchingCep && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
                </label>
                <input
                  type="text"
                  {...register("cep")}
                  className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  placeholder="00000-000"
                />
                {errors.cep && <p className="text-xs text-red-500 mt-1">{errors.cep.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                <input
                  type="text"
                  {...register("rua")}
                  className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.rua && <p className="text-xs text-red-500 mt-1">{errors.rua.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  {...register("numero")}
                  className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.numero && <p className="text-xs text-red-500 mt-1">{errors.numero.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                <input
                  type="text"
                  {...register("complemento")}
                  className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  {...register("bairro")}
                  className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.bairro && <p className="text-xs text-red-500 mt-1">{errors.bairro.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    {...register("cidade")}
                    className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.cidade && (
                    <p className="text-xs text-red-500 mt-1">{errors.cidade.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                  <select
                    {...register("estado")}
                    className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] bg-white"
                  >
                    <option value="">--</option>
                    {UF_LIST.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {errors.estado && (
                    <p className="text-xs text-red-500 mt-1">{errors.estado.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Endereço
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <HamsterLoader size="sm" message="Carregando endereços..." />
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nenhum endereço cadastrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`border p-4 rounded-xl shadow-sm bg-white transition-colors relative group ${
                  addr.is_default
                    ? "border-[var(--color-primary-300)] ring-1 ring-[var(--color-primary-200)]"
                    : "border-slate-200 hover:border-[var(--color-primary-200)]"
                }`}
              >
                {addr.is_default && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-2 py-0.5 rounded-full mb-2">
                    <CheckCircle2 className="w-3 h-3" /> Principal
                  </span>
                )}

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      title="Tornar principal"
                      className="text-slate-400 hover:text-amber-500 bg-slate-50 p-1.5 rounded-lg"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    title="Editar"
                    className="text-slate-400 hover:text-blue-500 bg-slate-50 p-1.5 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr)}
                    title="Excluir"
                    className="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-semibold text-slate-800">
                  {addr.rua}, {addr.numero}
                </p>
                {addr.complemento && (
                  <p className="text-sm text-slate-500">{addr.complemento}</p>
                )}
                <p className="text-sm text-slate-600 mt-1">
                  {addr.bairro} - {addr.cidade}/{addr.estado}
                </p>
                <p className="text-xs text-slate-400 mt-2">CEP: {addr.cep}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
