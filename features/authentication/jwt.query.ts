import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { secureQueryPersister } from "@/utils/mmkv";
import { queryClient } from "@/queries/queryClient";
import { fetchJwt } from "./authentication.api";
import { getCurrentSender } from "../multi-inbox/multi-inbox.store";

export function getJwtQueryOptions() {
  const currentSender = getCurrentSender();
  const enabled = !!currentSender?.ethereumAddress && !!currentSender.inboxId;
  return queryOptions({
    enabled,
    queryKey: ["jwt"],
    queryFn: enabled
      ? async () => {
          const { token } = await fetchJwt();
          return token;
        }
      : skipToken,
    staleTime: Infinity,
    persister: secureQueryPersister,
  });
}

export function useJwtQuery() {
  return useQuery(getJwtQueryOptions());
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export function getJwtQueryData() {
  return queryClient.getQueryData(getJwtQueryOptions().queryKey);
}

export function clearJwtQueryData() {
  queryClient.removeQueries(getJwtQueryOptions());
}
