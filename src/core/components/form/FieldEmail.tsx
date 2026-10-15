import { EuiFieldText, EuiText } from "@elastic/eui";
import {
  UseFormMethods,
  FieldName,
  FieldValues,
  useWatch,
} from "react-hook-form";
import { FormItem, FormItemProps } from "./FormItem";
import classNames from "classnames";
import styles from "./FieldEmail.module.scss";
import { getFormHelpText } from "./FormHelpText";

export type FieldEmailProps<T extends FieldValues> = Omit<
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
  validate?: (str: string) => boolean;
  hidden?: boolean;
  placeholder?: string;
  type?: string;
  compressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  maxLength?: number;
};

export function FieldEmail<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = "",
  fullWidth = true,
  onChange,
  append,
  prepend,
  required,
  readOnly,
  validate,
  hidden,
  placeholder,
  type,
  className,
  compressed,
  disabled,
  maxLength = 100,
  onClick,
  isInvalid: isInvalidProp,
  helpText,
}: FieldEmailProps<T>) {
  const { control } = form;
  const value = useWatch<string>({ name, control });

  const isInvalid: boolean = Boolean(
    isInvalidProp ||
    name in form.errors ||
    (value && value.length >= maxLength),
  );

  const computedHelpText = getFormHelpText(form.errors, name, {
    maxLength,
    pattern: "이메일",
  });

  return (
    <FormItem
      required={required}
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      style={hidden ? { display: "none" } : undefined}
      className={classNames(className, { [styles.invalid]: isInvalid })}
      helpText={computedHelpText ?? helpText}
    >
      <EuiFieldText
        name={name}
        aria-required={required}
        inputRef={form.register({
          required,
          pattern:
            /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          validate,
          maxLength,
        })}
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        append={append}
        prepend={prepend}
        isInvalid={isInvalid}
        readOnly={readOnly}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        autoCapitalize="off"
        compressed={compressed}
        disabled={disabled}
        onClick={onClick}
      />
    </FormItem>
  );
}
