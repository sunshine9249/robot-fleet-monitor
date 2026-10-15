import { Resource } from "../resources/resource";
import { Page } from "./pages";

export interface RoleSummary {
  id: number;
  name: string;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string | null;
  contact: string | null;
  jobPosition: string | null;
  role: RoleSummary;
}

export interface UserListItem extends UserInfo {
  lastLoginAt: number | null;
  createdAt: number;
}

export interface UserFormData {
  username: string;
  name: string;
  email: string | null;
  contact: string | null;
  jobPosition: string | null;
  roleId: number;
  /** 등록할 때만 */
  password?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  /** 모든 화면·리소스을 허용하는 관리자 역할. 권한을 편집할 수 없습니다 */
  isSystem: boolean;
  pages: Page[];
  resources: Resource[];
  userCount: number;
  createdAt: number;
}

export type RoleFormData = Pick<
  Role,
  "name" | "description" | "pages" | "resources"
>;
