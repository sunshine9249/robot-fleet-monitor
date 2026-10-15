import React from "react";

export interface LayoutContextData {
  mainSectionRef: React.RefObject<HTMLDivElement>;
}

export const defaultLayoutContextData: LayoutContextData = {
  mainSectionRef: { current: null },
};

export const LayoutContext = React.createContext<LayoutContextData>(
  defaultLayoutContextData,
);
