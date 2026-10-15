import { checkDuplicateEnumValues } from "../utils/enum";

/**
 * 리소스 권한 키. 로그인 토큰의 `resources` 와 역할의 `resources` 에 이 문자열이 담깁니다.
 *
 * 형식은 `도메인:동작` 입니다. 저장된 역할 권한이 이 문자열을 기준으로 하므로,
 * 한 번 쓴 키는 이름을 바꾸거나 다른 기능에 다시 쓰지 마세요. 꼭 바꿔야 하면
 * `mock/legacyRoles.ts` 처럼 저장된 데이터를 옮겨 주는 코드를 함께 넣습니다.
 * 새 리소스는 맨 아래에 키만 추가하면 됩니다 (번호 관리가 필요 없습니다).
 */
export enum Resource {
  // auth
  AuthResource = "auth:login",

  // robot
  RobotListResource = "robot:list",
  RobotViewResource = "robot:view",
  RobotAddResource = "robot:add",
  RobotEditResource = "robot:edit",
  RobotDeleteResource = "robot:delete",
  RobotCommandResource = "robot:command",
  AIChatAskResource = "robot:chat",
  MissionListResource = "mission:list",

  // site
  SiteMapResource = "site:map",

  // event
  EventListResource = "event:list",
  EventViewResource = "event:view",
  EventUpdateResource = "event:update",

  // dashboard
  DashboardSummaryResource = "dashboard:summary",

  // system/user
  UserListResource = "user:list",
  UserViewResource = "user:view",
  UserAddResource = "user:add",
  UserEditResource = "user:edit",
  UserDeleteResource = "user:delete",

  // system/role
  RoleListResource = "role:list",
  RoleAddResource = "role:add",
  RoleEditResource = "role:edit",
  RoleDeleteResource = "role:delete",

  // personal
  PersonalEditResource = "personal:edit",
  PasswordChangeResource = "personal:password",
}

checkDuplicateEnumValues("Resource", Resource);
