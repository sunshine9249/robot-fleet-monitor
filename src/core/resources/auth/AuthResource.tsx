import { useState } from "react";

import { auth } from "../../utils/auth";
import { Resource, ResourceType, registerResource } from "../register";
import { HTTPError } from "../../utils/api";
import type { ApiError } from "../../hooks/useUser";
import { ResourceName } from "../resourceName";

export type AuthResource = ResourceType<typeof AuthResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AuthResource = registerResource(
  {
    id: Resource.AuthResource,
    name: ResourceName[Resource.AuthResource],
  },
  () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [errorResponse, setErrorResponse] = useState<ApiError | null>(null);

    async function login(
      username: string,
      password: string,
      remember: boolean,
    ) {
      setLoading(true);
      setError(null);
      setErrorResponse(null);
      try {
        await auth.login(username, password, remember);
      } catch (error) {
        if (error instanceof HTTPError) {
          setErrorResponse(await error.response.json());
        } else if (error instanceof Error) {
          setError(error);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    }
    return { login, loading, error, errorResponse };
  },
);
