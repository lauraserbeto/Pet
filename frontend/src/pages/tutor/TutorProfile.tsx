import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Lock, Loader2 } from "lucide-react";
import { HamsterLoader } from "../../components/ui/HamsterLoader";

import { ApiError } from "../../lib/httpClient";
import { useAuth } from "../../contexts/AuthContext";
import { useProfile } from "../../lib/hooks/useProfile";
import { AddressesSection } from "../../components/tutor/AddressesSection";
import { formatPhone, PHONE_MASKED_REGEX } from "../../lib/utils/masks";

const personalSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(150),
  phone: z
    .string()
    .trim()
    .regex(PHONE_MASKED_REGEX, "Telefone inválido. Use (00) 00000-0000")
    .or(z.literal("")),
});
type PersonalForm = z.infer<typeof personalSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual obrigatória"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Za-z]/, "Inclua ao menos uma letra")
      .regex(/\d/, "Inclua ao menos um número"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova senha deve ser diferente da atual",
    path: ["newPassword"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export function TutorProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    updateProfile,
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
    uploadAvatar,
    isUploadingAvatar,
  } = useProfile();

  const currentUser = profile ?? user;
  const loadingInitial = authLoading || profileLoading;

  const {
    register: regPersonal,
    handleSubmit: handlePersonal,
    reset: resetPersonal,
    formState: { errors: personalErrors, isDirty: personalDirty },
  } = useForm<PersonalForm>({
    resolver: zodResolver(personalSchema),
    defaultValues: { full_name: "", phone: "" },
  });

  useEffect(() => {
    if (currentUser) {
      resetPersonal({
        full_name: currentUser.full_name ?? "",
        phone: currentUser.phone ?? "",
      });
    }
  }, [currentUser?.full_name, currentUser?.phone, resetPersonal]);

  const onSubmitPersonal = handlePersonal(async (values) => {
    try {
      await updateProfile({
        full_name: values.full_name,
        phone: values.phone || undefined,
      });
      toast.success("Dados pessoais atualizados!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao atualizar dados.";
      toast.error(message);
    }
  });

  const AVATAR_ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp"];
  const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo

    if (!file) return;

    if (!AVATAR_ACCEPTED_MIMES.includes(file.type)) {
      toast.error("Formato inválido", {
        description: "Envie uma imagem JPEG, PNG ou WebP.",
      });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Imagem muito grande", {
        description: "O arquivo deve ter no máximo 2 MB.",
      });
      return;
    }

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    try {
      await uploadAvatar(dataUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao enviar a foto.";
      toast.error(message);
    }
  };

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = handlePasswordSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Senha atualizada com sucesso!");
      resetPassword();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erro ao atualizar senha.";
      toast.error(message);
    }
  });

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <HamsterLoader message="Carregando seu perfil..." />
      </div>
    );
  }

  const avatarUrl = currentUser?.avatar_url ?? "";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-body)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
            Meu Perfil
          </h1>
          <p className="text-slate-500 mt-2">
            Gerencie suas informações, endereços e segurança.
          </p>
        </div>

        {/* --- Dados Pessoais --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={onSubmitPersonal} className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-6 font-[family-name:var(--font-display)]">
              <Camera className="w-5 h-5 text-[var(--color-primary-500)]" />
              Dados Pessoais & Foto
            </h2>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera size={40} />
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Alterar Foto
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    {...regPersonal("full_name")}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                    placeholder="Seu nome"
                  />
                  {personalErrors.full_name && (
                    <p className="text-sm text-red-500 mt-1">{personalErrors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail (Apenas leitura)
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email ?? ""}
                    disabled
                    className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm py-2 px-3 border outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    {...regPersonal("phone", {
                      onChange: (e) => {
                        e.target.value = formatPhone(e.target.value);
                      },
                    })}
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  />
                  {personalErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">{personalErrors.phone.message}</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile || !personalDirty}
                    className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-medium transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* --- Endereços --- */}
        <AddressesSection />

        {/* --- Segurança --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={onSubmitPassword} className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-6 font-[family-name:var(--font-display)]">
              <Lock className="w-5 h-5 text-[var(--color-primary-500)]" />
              Segurança
            </h2>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...regPassword("currentPassword")}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  placeholder="Sua senha atual"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...regPassword("newPassword")}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  placeholder="Mínimo 8 caracteres, com letra e número"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...regPassword("confirmPassword")}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] py-2 px-3 border outline-none"
                  placeholder="Repita a nova senha"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Atualizar Senha
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
