import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type SelectedItem = { id: number; name: string };
/** 헤더에 대상 선택기를 띄우는 화면 종류. 지금은 로봇 하나뿐입니다 */
export type SelectorOption = "robot" | undefined;

export interface Selected {
  robot?: SelectedItem;
}

/**
 * 화면을 옮겨도 유지되는 "지금 보고 있는 대상".
 * 대시보드에서 고른 로봇을 실시간 모니터링 화면이 이어받을 때 씁니다.
 */
export function useSelector() {
  const [option, setOption] = useState<SelectorOption>();
  const [selected, setSelected] = useLocalStorage<Selected>("rfm.selector", {});

  return {
    option,
    setOption,
    selected,
    setSelected,
  };
}
