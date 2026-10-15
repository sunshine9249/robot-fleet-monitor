import koKR from "./ko-KR";

export type Locale = "en-US" | "ko-KR";
export type LocaleStrings = {
  [P in Locale]?: {
    [key: string]: string;
  };
};

export const strings: LocaleStrings = {
  "ko-KR": koKR,
};
