import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, PawPrint, Calendar, Activity, X } from "lucide-react";

export function TutorPets() {
  const [user, setUser] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    species: "Cachorro",
    breed: "",
    birth_date: "",
    weight_kg: "",
    medical_notes: ""
  });

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("tutor_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPets(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pets.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("pets")
        .insert([{ ...formData, tutor_id: user.id }]);

      if (error) throw error;
      
      toast.success("Pet adicionado com sucesso!");
      setShowModal(false);
      setFormData({
        name: "", species: "Cachorro", breed: "", birth_date: "", weight_kg: "", medical_notes: ""
      });
      loadPets();
    } catch (error) {
      toast.error("Erro ao adicionar pet.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meus Pets</h1>
            <p className="text-slate-500 mt-2">Gerencie e acompanhe o perfil do seu melhor amigo.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
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
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum pet cadastrado</h3>
            <p className="text-slate-500 max-w-sm">Adicione seu primeiro pet para começar a usufruir de todos os serviços da Pet+.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-50)] rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-600)] flex items-center justify-center">
                      <PawPrint className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{pet.species} • {pet.breed}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-slate-400"/> Peso</span>
                    <span className="font-semibold text-slate-700">{pet.weight} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> Nasc.</span>
                    <span className="font-semibold text-slate-700">
                      {pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Pet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PawPrint className="text-[var(--color-primary-500)]" />
              Novo Pet
            </h2>

            <form onSubmit={handleSavePet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Pet</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Espécie</label>
                  <select value={formData.species} onChange={(e) => setFormData({...formData, species: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none bg-white">
                    <option value="Cachorro">Cachorro</option>
                    <option value="Gato">Gato</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Raça</label>
                  <input type="text" value={formData.breed} onChange={(e) => setFormData({...formData, breed: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                  <input type="date" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                  <input type="number" step="0.1" value={formData.weight_kg} onChange={(e) => setFormData({...formData, weight_kg: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none" placeholder="Ex: 5.5"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações Médicas</label>
                <textarea rows={3} value={formData.medical_notes} onChange={(e) => setFormData({...formData, medical_notes: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] py-2 px-3 border outline-none resize-none" placeholder="Alergias, medicamentos constantes..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cadastrar Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
