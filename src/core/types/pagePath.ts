import { Page } from "./pages";

/** [제목, 경로] */
export const PagePath = {
  [Page.Dashboard]: ["대시보드", "/dashboard"],
  [Page.Monitoring]: ["실시간 모니터링", "/monitoring"],
  [Page.Events]: ["이벤트 이력", "/events"],

  [Page.Robots]: ["로봇 관리", "/basic/robots"],

  [Page.Users]: ["사용자 관리", "/system/users"],
  [Page.Roles]: ["권한 관리", "/system/roles"],

  LoginPage: ["로그인", "/login"],
  PersonalPage: ["계정 설정", "/personal"],
} as const;

/** Page enum 에는 있는데 위 PagePath 에 경로가 없는 항목들 */
type PagesMissingPath = Exclude<Page, keyof typeof PagePath>;

/**
 * Page 를 추가하고 경로를 빠뜨리면 여기서 타입 에러가 납니다.
 * 에러 메시지에 빠진 Page 가 전부 나열됩니다.
 */
export const _allPagesHavePath: [PagesMissingPath] extends [never]
  ? true
  : PagesMissingPath = true;
