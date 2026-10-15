import { Resource } from "core/resources/resource";
import { Page } from "core/types/pages";

/**
 * 권한이 숫자 id 였던 시절(저장소 버전 1)의 번호표.
 *
 * 브라우저 localStorage 에 남아 있는 예전 역할 데이터를 문자열 키로 옮길 때만 씁니다.
 * 새 권한은 여기에 더하지 않습니다. 20 번은 지워진 리소스라 비어 있습니다.
 */
const LEGACY_PAGES: Record<number, Page> = {
  0: Page.Dashboard,
  1: Page.Monitoring,
  2: Page.Events,
  3: Page.Robots,
  4: Page.Users,
  5: Page.Roles,
};

const LEGACY_RESOURCES: Record<number, Resource> = {
  0: Resource.AuthResource,
  1: Resource.AIChatAskResource,
  2: Resource.RobotListResource,
  3: Resource.RobotViewResource,
  4: Resource.RobotAddResource,
  5: Resource.RobotEditResource,
  6: Resource.RobotDeleteResource,
  7: Resource.RobotCommandResource,
  8: Resource.MissionListResource,
  9: Resource.SiteMapResource,
  10: Resource.EventListResource,
  11: Resource.EventViewResource,
  12: Resource.EventUpdateResource,
  13: Resource.DashboardSummaryResource,
  14: Resource.UserListResource,
  15: Resource.UserViewResource,
  16: Resource.UserAddResource,
  17: Resource.UserEditResource,
  18: Resource.UserDeleteResource,
  19: Resource.RoleListResource,
  21: Resource.RoleAddResource,
  22: Resource.RoleEditResource,
  23: Resource.RoleDeleteResource,
  24: Resource.PersonalEditResource,
  25: Resource.PasswordChangeResource,
};

type LegacyRole = {
  pages?: (number | string)[];
  actions?: (number | string)[];
  resources?: string[];
};

function mapKeys<T extends string>(
  values: (number | string)[] | undefined,
  table: Record<number, T>,
): T[] {
  const result: T[] = [];
  for (const value of values ?? []) {
    // 이미 문자열이면 그대로, 숫자면 번호표로 옮기고 모르는 번호는 버립니다
    const key = typeof value === "number" ? table[value] : (value as T);
    if (key !== undefined && !result.includes(key)) result.push(key);
  }
  return result;
}

/** 버전 1 역할(`pages: number[]`, `actions: number[]`)을 문자열 키 형태로 바꿉니다 */
export function migrateLegacyRole<T extends LegacyRole>(
  role: T,
): Omit<T, "actions"> & { pages: Page[]; resources: Resource[] } {
  const { actions, ...rest } = role;
  return {
    ...rest,
    pages: mapKeys(role.pages, LEGACY_PAGES),
    resources: mapKeys(actions ?? role.resources, LEGACY_RESOURCES),
  };
}
