import { EuiFieldText } from "@elastic/eui";
import {
  useWatch,
  FieldName,
  FieldValues,
  UseFormMethods,
} from "react-hook-form";
import { FormItem, FormItemProps } from "./FormItem";
import classNames from "classnames";
import styles from "./FieldText.module.scss";
import { getFormHelpText } from "./FormHelpText";

export type FieldTextProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> & {
  name: FieldName<T>;
  form: UseFormMethods<T>;
  defaultValue?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  append?: JSX.Element;
  prepend?: JSX.Element;
  readOnly?: boolean;
  pattern?: RegExp;
  validate?: (str: string) => boolean | string;
  hidden?: boolean;
  placeholder?: string;
  type?: string;
  autoCapitalize?: string;
  compressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  isInvalid?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
};

export function FieldText<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = "",
  fullWidth = true,
  style,
  onChange,
  append,
  prepend,
  required,
  readOnly,
  pattern,
  validate,
  hidden,
  placeholder,
  type,
  className,
  autoCapitalize,
  compressed,
  disabled,
  maxLength = 100,
  onClick,
  isInvalid: isInvalidProp,
  autoFocus = false,
  helpText,
}: FieldTextProps<T>) {
  const { control } = form;
  const value = useWatch<string>({ name, control });
  const isInvalid: boolean =
    isInvalidProp ||
    name in form.errors ||
    Boolean(value && value.length >= maxLength);

  const computedHelpText = getFormHelpText(form.errors, name, {
    maxLength,
    validate: form.errors[name]?.message,
  });

  return (
    <FormItem
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      style={{ display: hidden ? "none" : "flex", ...style }}
      className={classNames(className, { [styles.invalid]: isInvalid })}
      required={required}
      helpText={computedHelpText ?? helpText}
    >
      <EuiFieldText
        name={name}
        aria-required={required}
        inputRef={form.register({
          required,
          pattern,
          validate,
          maxLength,
          control,
        })}
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        append={append}
        prepend={prepend}
        isInvalid={isInvalid}
        readOnly={readOnly}
        placeholder={placeholder}
        type={type}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        autoCapitalize={autoCapitalize}
        compressed={compressed}
        disabled={disabled}
        onClick={onClick}
        autoFocus={autoFocus}
      />
    </FormItem>
  );
}
