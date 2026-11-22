import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../httpClient";
import { LEGAL_TEXT_VERSION } from "../../content/legal/version";
export function useLegalPolicy() {
  return useQuery({
    queryKey: ["legal-policy"],
    queryFn: async () => {
      const policy = await httpClient.get<{ version: string; published_at: string }>(
        "/legal/policy",
        { auth: false }
      );
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(policy.version) ||
        policy.published_at !== policy.version ||
        policy.version !== LEGAL_TEXT_VERSION
      )
        throw Error("Versão dos termos indisponível.");
      return policy;
    },
    staleTime: 0,
    retry: false,
  });
}
