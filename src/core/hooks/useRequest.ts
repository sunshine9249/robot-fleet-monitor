import { useCallback, useRef } from "react";
import {
  useMutation as useTanstackMutation,
  useQuery as useTanstackQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getErrorMessage } from "../utils/api";

/**
 * 등록·수정·삭제처럼 버튼으로 부르는 요청.
 * 실패하면 서버 문구를 `error` 에 담고, 호출한 쪽에도 같은 문구로 다시 던집니다.
 */
export function useMutation<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutation = useTanstackMutation<R, Error, A>({
    mutationFn: async (args) => {
      try {
        return await fnRef.current(...args);
      } catch (caught) {
        throw new Error(await getErrorMessage(caught));
      }
    },
  });
  const { mutateAsync, reset } = mutation;

  const run = useCallback((...args: A) => mutateAsync(args), [mutateAsync]);
  /** 화면에 남은 실패 문구를 지웁니다 */
  const setError = useCallback((_value: null) => reset(), [reset]);

  return {
    run,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    setError,
  };
}

/**
 * 조회 요청. `key` 가 null 이면 부르지 않고, 바뀌면 다시 부릅니다.
 * 응답이 늦게 와서 이전 key 의 결과로 덮어쓰는 일은 TanStack Query 가 막아 줍니다.
 *
 * `name` 은 Resource 끼리 캐시가 섞이지 않게 붙이는 이름입니다
 * (같은 로봇 id 를 쓰는 로봇 상세와 임무 목록 등).
 */
export function useQuery<K, R>(
  name: string,
  key: K | null,
  fetcher: (key: K) => Promise<R>,
) {
  const queryClient = useQueryClient();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const queryKey = [name, key];

  const query = useTanstackQuery<R, Error>({
    queryKey,
    enabled: key !== null,
    queryFn: async () => {
      try {
        return await fetcherRef.current(key as K);
      } catch (caught) {
        throw new Error(await getErrorMessage(caught));
      }
    },
  });
  const { refetch } = query;

  const keyString = JSON.stringify(key);
  const reload = useCallback(async () => {
    if (keyString === "null") return null;
    const result = await refetch();
    return result.data ?? null;
  }, [keyString, refetch]);

  const setData = useCallback(
    (data: R | null) => {
      if (data === null) queryClient.removeQueries({ queryKey });
      else queryClient.setQueryData(queryKey, data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, name, keyString],
  );

  return {
    data: key === null ? null : (query.data ?? null),
    setData,
    loading: key !== null && query.isFetching,
    error: key === null ? null : (query.error?.message ?? null),
    reload,
  };
}
