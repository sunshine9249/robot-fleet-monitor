import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { getErrorMessage } from "../../utils/api";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { SiteMap } from "../../types/robot";

export type SiteMapResource = ResourceType<typeof SiteMapResource>;

/** 시설 지도는 거의 바뀌지 않아서 한 번 받으면 앱이 사는 동안 다시 쓰지 않습니다 */
let cached: SiteMap | null = null;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const SiteMapResource = registerResource(
  {
    id: Resource.SiteMapResource,
    name: ResourceName[Resource.SiteMapResource],
  },
  () => {
    const api = useApi();
    const [data, setData] = useState<SiteMap | null>(cached);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (cached) return;
      let cancelled = false;
      api
        .get("/api/site")
        .json<SiteMap>()
        .then((site) => {
          cached = site;
          if (!cancelled) setData(site);
        })
        .catch(async (caught) => {
          if (!cancelled) setError(await getErrorMessage(caught));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [api]);

    return { data, loading, error };
  },
);
