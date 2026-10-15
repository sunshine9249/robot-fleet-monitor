/**
 * This provides utility types that eui doesn't export
 */

import { EuiStepsHorizontalProps, EuiGlobalToastListProps } from "@elastic/eui";

export type EuiButtonSize = "s" | "m";

/* prettier-ignore */
export type EuiFlexItemGrowSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | true | false | null;

/* prettier-ignore */
export type EuiTextColorValue = "default" | "subdued" | "success" | "accent" | "danger" | "warning" | "ghost" | "inherit";

// export type EuiTableAction<T> = (DefaultItemAction<T> | CustomItemAction<T>)[];

export type EuiStepHorizontalProps = EuiStepsHorizontalProps["steps"][number];

export type EuiGlobalToastItem =
  Required<EuiGlobalToastListProps>["toasts"][number];
