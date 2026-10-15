import React from "react";

export interface RouteContextData {
  routes: JSX.Element[];
  defaultRoute: string;
}

export const RouteContext = React.createContext<RouteContextData>({
  routes: [],
  defaultRoute: "",
});
