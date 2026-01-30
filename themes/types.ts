import { defaultTheme } from "./default";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface Theme {
  name: string;
  extend: DeepPartial<(typeof defaultTheme)["extend"]>;
}

export function createTheme(theme: Theme) {
  return {
    name: theme.name,
    selectors: [`.theme-${theme.name}`],
    extend: theme.extend,
  };
}
