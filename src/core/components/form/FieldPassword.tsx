import { FieldValues, UseFormMethods, useWatch } from "react-hook-form";
import { EuiFieldPassword, EuiFieldPasswordProps, EuiI18n } from "@elastic/eui";
import { FormItem, FormItemProps } from "./FormItem";
import classNames from "classnames";
import styles from "./FieldText.module.scss";

export type FieldPasswordProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> & {
  name: string;
  form: UseFormMethods<T>;
  defaultValue?: string;
  fullWidth?: boolean;

  onChange?: (event: KeyboardEvent) => void;
  append?: JSX.Element;
  prepend?: JSX.Element;
  readOnly?: boolean;
  pattern?: RegExp;
  validate?: (str: string) => boolean;
  type?: EuiFieldPasswordProps["type"];
  maxLength?: number;
  className?: string;
  isInvalid?: boolean;
  autoComplete?: React.HTMLInputAutoCompleteAttribute;
  disabled?: boolean;
};

export function FieldPassword<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = "",
  fullWidth = true,
  append,
  prepend,
  required,
  readOnly,
  pattern,
  validate,
  type = "dual",
  maxLength = 100,
  className,
  isInvalid: isInvalidProp,
  helpText,
  autoComplete = "off",
  disabled = false,
}: FieldPasswordProps<T>) {
  const { control } = form;
  const value = useWatch<string>({ name, control });
  const isInvalid: boolean = Boolean(
    isInvalidProp ||
    name in form.errors ||
    (value && value.length >= maxLength),
  );

  return (
    <FormItem
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      className={classNames(className, {
        [styles.invalid]: isInvalid,
        [styles.passwordWithToggle]: type === "dual",
      })}
      required={required}
      helpText={
        (value && value.length >= maxLength && (
          <EuiI18n
            token="app.input.helpText.limit"
            default="You cannot enter more than {maxLength} characters."
            values={{ maxLength }}
          />
        )) ||
        helpText
      }
    >
      <EuiFieldPassword
        name={name}
        type={type}
        aria-required={required}
        inputRef={form.register({ required, pattern, validate, maxLength })}
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        append={append}
        prepend={prepend}
        isInvalid={isInvalid}
        readOnly={readOnly}
        autoComplete={autoComplete}
        disabled={disabled}
      />
    </FormItem>
  );
}
