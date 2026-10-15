import { Resource } from "./resource";

/** 권한 관리 화면에 보이는 리소스 이름 */
export const ResourceName: { [key in Resource]: string } = {
  [Resource.AuthResource]: "로그인",

  [Resource.AIChatAskResource]: "로봇별 AI 채팅",

  [Resource.RobotListResource]: "로봇 목록 조회",
  [Resource.RobotViewResource]: "로봇 상세 조회",
  [Resource.RobotAddResource]: "로봇 등록",
  [Resource.RobotEditResource]: "로봇 정보 수정",
  [Resource.RobotDeleteResource]: "로봇 삭제",
  [Resource.RobotCommandResource]: "로봇 원격 제어",
  [Resource.MissionListResource]: "임무 이력 조회",

  [Resource.SiteMapResource]: "시설 지도 조회",

  [Resource.EventListResource]: "이벤트 목록 조회",
  [Resource.EventViewResource]: "이벤트 상세 조회",
  [Resource.EventUpdateResource]: "이벤트 확인·조치 등록",

  [Resource.DashboardSummaryResource]: "대시보드 집계 조회",

  [Resource.UserListResource]: "사용자 목록 조회",
  [Resource.UserViewResource]: "사용자 상세 조회",
  [Resource.UserAddResource]: "사용자 등록",
  [Resource.UserEditResource]: "사용자 정보 수정",
  [Resource.UserDeleteResource]: "사용자 삭제",

  [Resource.RoleListResource]: "권한 목록 조회",
  [Resource.RoleAddResource]: "권한 등록",
  [Resource.RoleEditResource]: "권한 수정",
  [Resource.RoleDeleteResource]: "권한 삭제",

  [Resource.PersonalEditResource]: "내 정보 수정",
  [Resource.PasswordChangeResource]: "비밀번호 변경",
};
