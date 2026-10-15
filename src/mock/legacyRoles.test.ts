import { describe, expect, it } from "vitest";
import { Resource } from "core/resources/resource";
import { Page } from "core/types/pages";
import { migrateLegacyRole } from "./legacyRoles";

describe("migrateLegacyRole", () => {
  it("숫자 id 로 저장된 화면·리소스 권한을 문자열 키로 옮긴다", () => {
    const role = migrateLegacyRole({
      id: 2,
      name: "운영자",
      pages: [0, 1, 3],
      actions: [2, 3, 7, 25],
    });

    expect(role.pages).toEqual([Page.Dashboard, Page.Monitoring, Page.Robots]);
    expect(role.resources).toEqual([
      Resource.RobotListResource,
      Resource.RobotViewResource,
      Resource.RobotCommandResource,
      Resource.PasswordChangeResource,
    ]);
    expect("actions" in role).toBe(false);
    expect(role.name).toBe("운영자");
  });

  it("지워진 번호(20)와 모르는 번호는 버리고 중복은 한 번만 남긴다", () => {
    const role = migrateLegacyRole({
      pages: [4, 4, 99],
      actions: [20, 99, 19, 19],
    });

    expect(role.pages).toEqual([Page.Users]);
    expect(role.resources).toEqual([Resource.RoleListResource]);
  });

  it("이미 문자열 키인 역할은 그대로 둔다", () => {
    const role = migrateLegacyRole({
      pages: [Page.Events],
      resources: [Resource.EventListResource],
    });

    expect(role.pages).toEqual([Page.Events]);
    expect(role.resources).toEqual([Resource.EventListResource]);
  });
});

describe("권한 키", () => {
  it("리소스 키는 `도메인:동작` 형식이고 겹치지 않는다", () => {
    const keys = Object.values(Resource);

    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^[a-z]+:[a-z]+$/));
  });

  it("화면 키는 겹치지 않는다", () => {
    const keys = Object.values(Page);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
