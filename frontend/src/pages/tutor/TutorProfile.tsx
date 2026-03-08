import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Camera, MapPin, Lock, Loader2, Plus, Edit2, Trash2 } from "lucide-react";

export function TutorProfile() {
  const [user, setUser] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Personal Data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: ""
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      // Fetch user personal data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (!userError && userData) {
        setFullName(userData.full_name || "");
        setPhone(userData.phone || "");
        setAvatarUrl(userData.avatar_url || "");
      }

      await loadAddresses(session.user.id);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadAddresses = async (userId: string) => {
    setLoadingAddresses(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
    setLoadingAddresses(false);
  };

  const handleSavePersonal = async () => {
    if (!user) return;
    setIsSavingPersonal(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ full_name: fullName, phone: phone })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Dados pessoais atualizados!");
    } catch (error) {
      toast.error("Erro ao atualizar dados.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;

      // Update users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload da foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        const { error } = await supabase
          .from("addresses")
          .update({ ...addressForm })
          .eq("id", editingAddressId);
        if (error) throw error;
        toast.success("Endereço atualizado!");
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert([{ ...addressForm, user_id: user.id }]);
        if (error) throw error;
        toast.success("Endereço adicionado!");
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
      loadAddresses(user.id);
    } catch (error) {
      toast.error("Erro ao salvar endereço.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Endereço excluído!");
      if (user) loadAddresses(user.id);
    } catch (error) {
      toast.error("Erro ao excluir endereço.");
    }
  };

  const openEditAddress = (addr: any) => {
    setAddressForm({
      cep: addr.cep || "", rua: addr.rua || "", numero: addr.numero || "",
      complemento: addr.complemento || "", bairro: addr.bairro || "",
      cidade: addr.cidade || "", estado: addr.estado || ""
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Erro ao atualizar senha.");
    } finally {
      setIsSavingPassword(false);
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meu Perfil</h1>
          <p className="text-slate-500 mt-2">Gerencie suas informações, endereços e segurança.</p>
        </div>

        {/* --- Dados Pessoais --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-[var(--color-primary-500)]" />
              Dados Pessoais & Foto
            </h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera size={40} />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="avatar-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    Alterar Foto
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Form */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Apenas leitura)</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm py-2 px-3 border outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSavePersonal}
                    disabled={isSavingPersonal}
                    className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-medium transition-all shadow-md shadow-primary-500/20 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSavingPersonal && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Endereços --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--color-primary-500)]" />
                Meus Endereços
              </h2>
              {!showAddressForm && (
                <button
                  onClick={() => {
                    setAddressForm({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
                    setEditingAddressId(null);
                    setShowAddressForm(true);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Novo Endereço
                </button>
              )}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleSaveAddress} className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                    <input type="text" required value={addressForm.cep} onChange={(e) => setAddressForm({...addressForm, cep: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                    <input type="text" required value={addressForm.rua} onChange={(e) => setAddressForm({...addressForm, rua: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                    <input type="text" required value={addressForm.numero} onChange={(e) => setAddressForm({...addressForm, numero: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                    <input type="text" value={addressForm.complemento} onChange={(e) => setAddressForm({...addressForm, complemento: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                    <input type="text" required value={addressForm.bairro} onChange={(e) => setAddressForm({...addressForm, bairro: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                      <input type="text" required value={addressForm.cidade} onChange={(e) => setAddressForm({...addressForm, cidade: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                      <input type="text" required value={addressForm.estado} onChange={(e) => setAddressForm({...addressForm, estado: e.target.value})} className="w-full rounded-lg border-slate-300 py-2 px-3 border outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancelar</button>
                  <button type="submit" disabled={isSavingAddress} className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70">
                    {isSavingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Endereço
                  </button>
                </div>
              </form>
            ) : null}

            {loadingAddresses ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhum endereço cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-slate-200 p-4 rounded-xl shadow-sm bg-white hover:border-[var(--color-primary-200)] transition-colors relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAddress(addr)} className="text-slate-400 hover:text-blue-500 bg-slate-50 p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="font-semibold text-slate-800">{addr.rua}, {addr.numero}</p>
                    {addr.complemento && <p className="text-sm text-slate-500">{addr.complemento}</p>}
                    <p className="text-sm text-slate-600 mt-1">{addr.bairro} - {addr.cidade}/{addr.estado}</p>
                    <p className="text-xs text-slate-400 mt-2">CEP: {addr.cep}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* --- Segurança --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-[var(--color-primary-500)]" />
              Segurança
            </h2>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  placeholder="Repita a nova senha"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={handleSavePassword}
                  disabled={isSavingPassword || !newPassword || !confirmPassword}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Atualizar Senha
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
