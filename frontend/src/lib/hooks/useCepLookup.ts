import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface CepData {
  address_line: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
}

interface UseCepLookupReturn {
  isFetchingCep: boolean;
  lookupCep: (rawCep: string) => Promise<CepData | null>;
}

export function useCepLookup(): UseCepLookupReturn {
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const lookupCep = useCallback(async (rawCep: string): Promise<CepData | null> => {
    const cleanCep = rawCep.replace(/\D/g, "");

    if (cleanCep.length !== 8) return null;

    setIsFetchingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

      if (!response.ok) {
        toast.error("Falha ao conectar com o serviço de CEP.");
        return null;
      }

      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado. Verifique o número e tente novamente.");
        return null;
      }

      return {
        address_line: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        complement: data.complemento ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      toast.error("Erro ao buscar o CEP. Tente novamente.");
      return null;
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  return { isFetchingCep, lookupCep };
}
