import { checkDuplicateEnumValues } from "../utils/enum";

/**
 * 화면 권한 키. 로그인 토큰의 `pages` 와 역할의 `pages` 에 이 문자열이 담깁니다.
 *
 * 저장된 역할 권한이 이 문자열을 기준으로 하므로, 한 번 쓴 키는 이름을 바꾸거나
 * 다른 화면에 다시 쓰지 마세요. 새 화면은 맨 아래에 키만 추가하면 됩니다.
 */
export enum Page {
  Dashboard = "dashboard",
  Monitoring = "monitoring",
  Events = "events",
  Robots = "robots",
  Users = "users",
  Roles = "roles",
}

checkDuplicateEnumValues("Page", Page);
