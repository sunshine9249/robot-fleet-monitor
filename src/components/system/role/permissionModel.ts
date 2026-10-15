import { Resource, ResourceName, ResourceIdentifier, Page, pages } from "core";

export interface PermissionPage {
  page: Page;
  /** 표에 보이는 순서 (메뉴 구역 → 구역 안 순서) */
  order: [number, number];
  title: string;
  group: string;
  /** 화면을 열면 꼭 필요한 리소스 (화면 권한에 딸려 옵니다) */
  required: Resource[];
  /** 따로 켜고 끄는 기능 */
  optional: Resource[];
}

const GROUP_TITLE: Record<number, string> = {
  0: "관제",
  1: "관제",
  2: "관제",
  3: "기본 정보",
  4: "시스템",
};

/**
 * 등록된 화면 목록에서 권한 편집 표를 만듭니다.
 * 화면을 새로 추가하면 여기 따로 손대지 않아도 표에 나타납니다.
 */
export function buildPermissionModel(): {
  pages: PermissionPage[];
  /** 화면과 상관없이 쓰는 기능 (내 정보 수정 등) */
  common: Resource[];
} {
  const result: PermissionPage[] = [];
  const common = new Set<Resource>();
  for (const { options } of pages.values()) {
    const required = options.resources.map(
      (fn) => fn[ResourceIdentifier] as Resource,
    );
    const optional = (options.optionalResources ?? []).map(
      (fn) => fn[ResourceIdentifier] as Resource,
    );
    if (options.page === undefined) {
      [...required, ...optional]
        .filter((resource) => resource !== Resource.AuthResource)
        .forEach((resource) => common.add(resource));
      continue;
    }
    const section = options.section ?? options.pageGroup?.options.section ?? 0;
    result.push({
      page: options.page,
      order: [section, options.sortIndex ?? 0],
      title: String(options.title),
      group: GROUP_TITLE[section] ?? "기타",
      required,
      optional: optional.filter((resource) => !required.includes(resource)),
    });
  }
  result.sort(
    (left, right) =>
      left.order[0] - right.order[0] || left.order[1] - right.order[1],
  );
  return { pages: result, common: [...common] };
}

export function resourceLabel(resource: Resource) {
  return ResourceName[resource];
}

/** 켠 화면에 필요한 리소스을 더해 저장할 리소스 목록을 만듭니다 */
export function normalizeResources(
  enabledPages: Page[],
  chosen: Resource[],
  model: ReturnType<typeof buildPermissionModel>,
): Resource[] {
  const set = new Set<Resource>();
  for (const page of model.pages) {
    if (!enabledPages.includes(page.page)) continue;
    page.required.forEach((resource) => set.add(resource));
    page.optional
      .filter((resource) => chosen.includes(resource))
      .forEach((resource) => set.add(resource));
  }
  model.common
    .filter((resource) => chosen.includes(resource))
    .forEach((resource) => set.add(resource));
  return [...set].sort();
}
