import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../lib/httpClient";
import { reviewService, type ReviewOrigin } from "../../lib/services/reviewService";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Stars } from "./RatingBadge";

export function ReviewComposer({
  origin,
  label,
  completed,
}: {
  origin: ReviewOrigin;
  label: string;
  completed: boolean;
}) {
  const { user } = useAuth();
  if (!completed || user?.role_id !== 5) return null;
  return (
    <Composer
      key={`${user.id}:${JSON.stringify(origin)}`}
      origin={origin}
      label={label}
      userId={user.id}
    />
  );
}
function Composer({
  origin,
  label,
  userId,
}: {
  origin: ReviewOrigin;
  label: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const key = ["review-mine", userId, origin];
  const own = useQuery({
    queryKey: key,
    queryFn: () => reviewService.mine(origin),
    enabled: open,
    staleTime: 0,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ rating: string; comment: string }>({ defaultValues: { rating: "", comment: "" } });
  const verify = async () => {
    const result = await own.refetch();
    if (result.isSuccess) {
      setUncertain(false);
      setNotice(
        result.data.review
          ? "Sua avaliação já foi registrada."
          : "Nenhuma avaliação foi encontrada. Confira os dados antes de enviar novamente."
      );
    }
  };
  const mutation = useMutation({
    mutationFn: (values: { rating: number; comment?: string }) =>
      reviewService.create(origin, values),
    onSuccess: (result) => {
      client.setQueryData(key, { review: result.review });
      reset();
      setUncertain(false);
      setNotice("Avaliação enviada com sucesso.");
      void client.invalidateQueries({
        predicate: (query) =>
          [
            "reviews",
            "public-product",
            "public-products",
            "public-partners",
            "public-provider",
          ].includes(String(query.queryKey[0])),
      });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setUncertain(true);
        await verify();
      } else if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500)
        setUncertain(true);
    },
  });
  const submit = handleSubmit(async (values) => {
    if (running.current || uncertain || own.isPending || own.isError || own.data?.review) return;
    running.current = true;
    setNotice("");
    try {
      await mutation.mutateAsync({
        rating: Number(values.rating),
        comment: values.comment.trim() || undefined,
      });
    } catch {
      /* Mensagem mantida no diálogo, sem repetir o POST automaticamente. */
    } finally {
      running.current = false;
    }
  });
  return (
    <div>
      <Button
        ref={trigger}
        variant="outline"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="h-auto min-h-10 max-w-full whitespace-normal text-left"
      >
        <span className="min-w-0 break-words">
          {own.data?.review ? "Ver avaliação enviada" : `Avaliar ${label}`}
        </span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!running.current) setOpen(value);
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogTitle className="break-words pr-6">Avaliar {label}</DialogTitle>
          <DialogDescription>
            Conte como foi sua experiência. A nota deve ser de 1 a 5; o comentário é opcional.
          </DialogDescription>
          {notice && (
            <p role="status" className="text-sm text-emerald-800">
              {notice}
            </p>
          )}
          {own.isPending ? (
            <p role="status">Conferindo sua avaliação...</p>
          ) : own.isError ? (
            <div role="alert">
              <p>Não foi possível conferir sua avaliação.</p>
              <Button onClick={() => void own.refetch()}>Tentar novamente</Button>
            </div>
          ) : own.data?.review ? (
            <div className="space-y-3">
              <p>Você já avaliou este item.</p>
              <Stars rating={own.data.review.rating} />
              {own.data.review.comment && (
                <p className="whitespace-pre-wrap break-words">{own.data.review.comment}</p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <fieldset disabled={mutation.isPending || uncertain} className="space-y-3">
                <legend className="mb-2 text-sm font-semibold">Sua nota</legend>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 p-3"
                    >
                      <input
                        type="radio"
                        aria-label={`${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                        value={rating}
                        {...register("rating", { required: "Escolha uma nota." })}
                      />
                      {rating}
                      <span className="sr-only">{rating === 1 ? "estrela" : "estrelas"}</span>
                    </label>
                  ))}
                </div>
                {errors.rating && (
                  <p role="alert" className="text-sm text-red-700">
                    {errors.rating.message}
                  </p>
                )}
                <label className="block space-y-1 text-sm">
                  Comentário (opcional)
                  <textarea
                    maxLength={2000}
                    rows={4}
                    {...register("comment", { maxLength: 2000 })}
                    className="block w-full rounded-lg border border-slate-300 p-3"
                  />
                </label>
                <p className="text-xs text-slate-500">Até 2.000 caracteres.</p>
                {errors.comment && (
                  <p role="alert" className="text-sm text-red-700">
                    O comentário deve ter até 2.000 caracteres.
                  </p>
                )}
              </fieldset>
              {mutation.isError && !uncertain && (
                <p role="alert" className="text-sm text-red-700">
                  {mutation.error.message}
                </p>
              )}
              {uncertain && (
                <div role="alert" className="space-y-2 text-sm text-amber-900">
                  <p>O envio pode ter sido concluído. Confira antes de reenviar.</p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={own.isFetching || mutation.isPending}
                    onClick={() => void verify()}
                  >
                    Verificar envio
                  </Button>
                </div>
              )}
              <Button disabled={mutation.isPending || uncertain || own.isFetching} type="submit">
                {mutation.isPending ? "Enviando..." : "Enviar avaliação"}
              </Button>
            </form>
          )}
          <Button variant="ghost" disabled={mutation.isPending} onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
