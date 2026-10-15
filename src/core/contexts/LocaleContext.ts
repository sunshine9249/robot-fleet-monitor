import React from "react";
// eslint-disable-next-line import/no-restricted-paths
import { Locale } from "../../strings";

export const LocaleContext = React.createContext<
  readonly [Locale, React.Dispatch<React.SetStateAction<Locale>>]
>(["ko-KR", () => {}]);
