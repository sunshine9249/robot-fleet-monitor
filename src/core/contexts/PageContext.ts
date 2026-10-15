import React from "react";
import { usePage } from "../hooks/usePage";

export const PageContext = React.createContext<ReturnType<typeof usePage>>({
  title: null,
  setTitle: () => {},
  headerSubtitle: null,
  setHeaderSubtitle: () => {},
  sidebar: [],
  hasPagePermission: () => undefined,
});
