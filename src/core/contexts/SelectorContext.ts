import React from "react";
import { useSelector } from "../hooks/useSelector";

export const SelectorContext = React.createContext<
  ReturnType<typeof useSelector>
>({
  option: undefined,
  setOption: () => {},
  selected: {},
  setSelected: () => {},
});
