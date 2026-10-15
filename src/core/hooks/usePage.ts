import React, { useState, useEffect, useCallback } from "react";
import { getSidebarTree } from "../utils/sidebar";
import { auth } from "../utils/auth";
import { Page, SidebarTreePage } from "core/types";

export function usePage() {
  const [title, setTitle] = useState<React.ReactNode>(null);
  /**
   * 헤더 서비스명 옆에 붙는 보조 제목.
   * 상단 메뉴에 없는 화면(AI 챗봇 등)이 "지금 어디인지"를 알리는 용도라
   * 필요한 페이지만 직접 채웁니다. 비워 두면 아무것도 그리지 않습니다.
   */
  const [headerSubtitle, setHeaderSubtitle] = useState<React.ReactNode>(null);
  const [sidebar, setSidebar] = useState(() => getSidebarTree());
  const hasPagePermission = useCallback(
    (page: Page) => {
      const menus: SidebarTreePage[] = [];
      for (const item of sidebar) {
        for (const itemC of item) {
          if ("children" in itemC) {
            for (const child of itemC.children) {
              menus.push(child);
            }
          } else {
            menus.push(itemC);
          }
        }
      }

      return menus.find((menu) => menu.page === page);
    },
    [sidebar],
  );

  useEffect(() => {
    const unlisten = auth.onTokenUpdate((loggedIn) => {
      if (loggedIn) {
        setSidebar(getSidebarTree());
      }
    });
    return unlisten;
  }, []);

  return {
    title,
    setTitle,
    headerSubtitle,
    setHeaderSubtitle,
    sidebar,
    hasPagePermission,
  };
}
