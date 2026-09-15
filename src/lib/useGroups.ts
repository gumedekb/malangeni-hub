import { useEffect, useState } from "react";
import { api, COMMUNITY_ENDPOINTS } from "./api";
import type { ApiGroup } from "./types";

/** All community groups (null while loading, empty if they couldn't be read). */
export function useGroups(): ApiGroup[] | null {
  const [groups, setGroups] = useState<ApiGroup[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await api.get<ApiGroup[]>(COMMUNITY_ENDPOINTS.groups);
        if (!cancelled) setGroups(list ?? []);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return groups;
}
