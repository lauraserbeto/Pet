import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, PawPrint, Calendar, Activity, X, Trash2, Edit2 } from "lucide-react";

import { ApiError } from "../../lib/httpClient";
import { usePets } from "../../lib/hooks/usePets";
import { SPECIES_LABEL, type Pet, type PetSpecies } from "../../lib/services/petService";

const petSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(100),
  species: z.enum(["DOG", "CAT", "OTHER"] as const),
  breed: z.string().trim().max(100).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  weight_kg: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : undefined;
    })
    .pipe(z.number().positive("Peso deve ser maior que zero").max(200, "Máx 200kg").optional()),
  medical_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type PetForm = z.input<typeof petSchema>;

const EMPTY: PetForm = {
  name: "",
  species: "DOG",
  breed: "",
  birth_date: "",
  weight_kg: "",
  medical_notes: "",
};

export function TutorPets() {
  const { pets, isLoading, createPet, isCreating, updatePet, isUpdating, removePet } = usePets();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!showModal) reset(EMPTY);
  }, [showModal, reset]);

  const openCreate = () => {
    reset(EMPTY);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (pet: Pet) => {
    reset({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? "",
      birth_date: pet.birth_date ? pet.birth_date.substring(0, 10) : "",
      weight_kg: pet.weight_kg ?? "",
      medical_notes: pet.medical_notes ?? "",
    });
    setEditingId(pet.id);
    setShowModal(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      species: values.species as PetSpecies,
      breed: values.breed || undefined,
      birth_date: values.birth_date
        ? new Date(values.birth_date as string).toISOString()
        : null,
      weight_kg: (values.weight_kg as number | undefined) ?? null,
      medical_notes: values.medical_notes || undefined,
    };
    try {
      if (editingId) {
        await updatePet({ id: editingId, payload });
        toast.success("Pet atualizado!");
      } else {
        await createPet(payload);
        toast.success("Pet adicionado com sucesso!");
      }
      setShowModal(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao salvar pet.";
      toast.error(message);
    }
  });

  const handleDelete = async (pet: Pet) => {
    if (!confirm(`Tem certeza que deseja remover ${pet.name}?`)) return;
    try {
      await removePet(pet.id);
      toast.success("Pet removido.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao remover pet.";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-body)]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Meus Pets
            </h1>
            <p className="text-slate-500 mt-2">
              Gerencie e acompanhe o perfil do seu melhor amigo.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-primary-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Adicionar Pet
          </button>
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <PawPrint size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-[family-name:var(--font-display)]">
              Nenhum pet cadastrado
            </h3>
            <p className="text-slate-500 max-w-sm">
              Adicione seu primeiro pet para começar a usufruir de todos os serviços da Pet+.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-50)] rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-600)] flex items-center justify-center">
                      <PawPrint className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                      <p className="text-sm font-medium text-slate-500">
                        {SPECIES_LABEL[pet.species] ?? pet.species} • {pet.breed || "SRD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(pet)}
                      className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pet)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-slate-400" /> Peso
                    </span>
                    <span className="font-semibold text-slate-700">{pet.weight_kg ?? "0"} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" /> Nasc.
                    </span>
                    <span className="font-semibold text-slate-700">
                      {pet.birth_date
                        ? new Date(pet.birth_date).toLocaleDateString("pt-BR")
                        : "Não informado"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 font-[family-name:var(--font-display)]">
              <PawPrint className="text-[var(--color-primary-500)]" />
              {editingId ? "Editar Pet" : "Novo Pet"}
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Pet</label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Espécie</label>
                  <select
                    {...register("species")}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none bg-white"
                  >
                    <option value="DOG">Cachorro</option>
                    <option value="CAT">Gato</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Raça</label>
                  <input
                    type="text"
                    {...register("breed")}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().substring(0, 10)}
                    {...register("birth_date")}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("weight_kg")}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none"
                    placeholder="Ex: 5.5"
                  />
                  {errors.weight_kg && (
                    <p className="text-xs text-red-500 mt-1">{errors.weight_kg.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Observações Médicas
                </label>
                <textarea
                  rows={3}
                  {...register("medical_notes")}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none resize-none"
                  placeholder="Alergias, medicamentos constantes..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Salvar Alterações" : "Cadastrar Pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
