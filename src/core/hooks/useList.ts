import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ky, { ResponsePromise } from "ky";
import { useApi } from "./useApi";

export type Order = "asc" | "desc";
export const useListDefault = {
  page: 1,
  pageSize: 20,
  sort: "id",
  order: "desc",
};
export interface ListResponse<T = any> {
  items: T[];
  count: number;
}

export type ListResolverParams<T = any> = {
  page: number;
  pageSize: number;
  sort: keyof T;
  order: Order;
};

export type ListResolver<T = any> = (
  api: typeof ky,
  params: ListResolverParams<T>,
) => ResponsePromise | null;

export type ListDefaultParams<T = any> = {
  page: number;
  pageSize: number;
  sort: keyof T;
  order: Order;
};
export interface ExtendedListResponse<T = any> {
  items: T[];
  count: number;
  [key: string]: any; // 동적 필드를 포함하기 위해 추가
}

export type UseListOptions<T> = Partial<ListDefaultParams<T>> & {
  /**
   * 캐시 키. 목록 이름과 resolver 가 쓰는 필터 값을 담습니다
   * (예: `["robots", { query, type, status }]`). 필터가 바뀌면 1쪽부터 다시 받습니다.
   */
  queryKey: readonly unknown[];
};

export function useList<T extends { id: any } = any>(
  resolver: ListResolver<T>,
  options: UseListOptions<T>,
) {
  const { queryKey: filterKey, ...defaults } = options;
  const defaultValues: ListDefaultParams<T> = {
    ...(useListDefault as ListDefaultParams<T>),
    ...defaults,
  };

  const api = useApi();
  const [active, setActive] = useState<boolean>(false);

  // 필터가 바뀌면 1쪽으로 돌아갑니다. 상태를 고쳐 쓰는 대신 "어느 필터에서 고른 쪽인지"를
  // 함께 들고 있다가 다르면 1쪽으로 읽으니, 이전 쪽으로 불필요한 요청이 나가지 않습니다.
  const filterKeyString = JSON.stringify(filterKey);
  const [pageState, setPageState] = useState({
    filter: filterKeyString,
    page: defaultValues.page,
  });
  const page =
    pageState.filter === filterKeyString ? pageState.page : defaultValues.page;
  const setPage = useCallback(
    (next: number) => setPageState({ filter: filterKeyString, page: next }),
    [filterKeyString],
  );

  const [pageSize, setPageSize] = useState<number>(defaultValues.pageSize);
  const [sort, setSort] = useState<keyof T>(defaultValues.sort);
  const [order, setOrder] = useState<Order>(defaultValues.order);

  const params: ListResolverParams<T> = { page, pageSize, sort, order };

  const query = useQuery<ExtendedListResponse<T>, Error>({
    queryKey: [...filterKey, params],
    enabled: active,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const responsePromise = resolver(api, params);
      if (!responsePromise) return { items: [], count: 0 };
      return responsePromise.json<ExtendedListResponse<T>>();
    },
  });
  const { refetch } = query;

  // 화면을 떠나면(비활성) 쪽·정렬을 처음 값으로 되돌립니다
  const {
    page: defaultPage,
    pageSize: defaultPageSize,
    sort: defaultSort,
    order: defaultOrder,
  } = defaultValues;
  useEffect(() => {
    if (active) return;
    setPageState({ filter: filterKeyString, page: defaultPage });
    setPageSize(defaultPageSize);
    setSort(defaultSort);
    setOrder(defaultOrder);
  }, [
    active,
    filterKeyString,
    defaultPage,
    defaultPageSize,
    defaultSort,
    defaultOrder,
  ]);

  const reload = useCallback(async () => {
    if (active) await refetch();
  }, [active, refetch]);

  const data = active ? query.data : undefined;
  const { items, count, ...additionalData } = data ?? {
    items: [] as T[],
    count: 0,
  };

  return {
    active,
    setActive,
    loading: active && query.isFetching,
    error: active ? (query.error ?? null) : null,
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    setSort,
    order,
    setOrder,
    items: items as T[],
    count: count as number,
    reload,
    additionalData,
  };
}
