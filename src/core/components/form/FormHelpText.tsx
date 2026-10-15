import { EuiText } from "@elastic/eui";
import { FieldErrors, FieldValues } from "react-hook-form";

export type ErrorType = keyof typeof FORM_HELP_TEXT;

export type HelpTextOptions = {
  maxLength?: number;
  pattern?: string;
  max?: number;
  min?: number;
  step?: string | number;
  validate?: string;
  [key: string]: any;
};

export const FORM_HELP_TEXT = {
  maxLength: (maxLength: number) => `${maxLength}자 이상 입력할 수 없습니다`,
  pattern: (type?: string) =>
    `${type ? type + " " : ""}형식이 올바르지 않습니다.`,
  required: () => "필수 입력 항목입니다.",
  max: (max: number) => `최대 입력 가능한 숫자는 ${max}입니다.`,
  min: (min: number) => `최소 입력 가능한 숫자는 ${min}입니다.`,
  step: (step: string) => `숫자 증감은 ${step}단위 입니다.`,
  validate: (validateMsg?: string) => validateMsg || "",
} as const;

export const renderHelpTextDangerColor = (text: string) => (
  <EuiText color="danger" size="xs">
    {text}
  </EuiText>
);

export const getFormHelpText = <T extends FieldValues>(
  errors: FieldErrors<T>,
  fieldName: string,
  options: HelpTextOptions = {},
): React.ReactNode | undefined => {
  const errorType = errors[fieldName] ? errors[fieldName].type : undefined;

  if (errorType) {
    const label = FORM_HELP_TEXT[errorType](options[errorType]);
    return renderHelpTextDangerColor(label);
  } else {
    return undefined;
  }
};
