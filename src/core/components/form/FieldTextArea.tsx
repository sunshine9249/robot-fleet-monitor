import { EuiI18n, EuiTextArea } from "@elastic/eui";

import {
  UseFormMethods,
  FieldName,
  FieldValues,
  useWatch,
} from "react-hook-form";
import { FormItem, FormItemProps } from "./FormItem";

import styles from "./FieldTextArea.module.scss";

import classNames from "classnames";

export type FieldTextAreaProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> & {
  name: FieldName<T>;
  form: UseFormMethods<T>;
  defaultValue?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  pattern?: RegExp;
  validate?: (str: string) => boolean;
  hidden?: boolean;
  placeholder?: string;
  autoCapitalize?: string;
  compressed?: boolean;
  disabled?: boolean;
  height?: string | number;
  isInvalid?: boolean;
  maxLength?: number;
  style?: React.CSSProperties;
};

export function FieldTextArea<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = "",
  fullWidth = true,
  required = false,
  readOnly,
  pattern,
  validate,
  hidden,
  placeholder,
  className,
  onChange: onChangeProp,
  autoCapitalize,
  compressed,
  disabled = false,
  isInvalid: isInvalidProp,
  height = 80,
  maxLength = 50000,
  helpText,
  style,
}: FieldTextAreaProps<T>) {
  const {
    formState: { errors, isDirty, isSubmitting, touchedFields, submitCount },
    control,
  } = form;
  const value = useWatch<string>({ name, control });
  const isInvalid: boolean =
    isInvalidProp ||
    name in form.errors ||
    Boolean(value && value.length >= maxLength);

  return (
    <FormItem
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      className={classNames(className, { [styles.invalid]: isInvalid })}
      style={
        hidden
          ? { display: "none", height: `calc( ${height} + 25)`, ...style }
          : { height: `calc( ${height} + 25)`, ...style }
      }
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
      <EuiTextArea
        name={name}
        aria-required={required}
        inputRef={form.register({ required, pattern, validate, maxLength })}
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        isInvalid={isInvalid}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={
          onChangeProp ? (event) => onChangeProp(event.target.value) : undefined
        }
        autoCapitalize={autoCapitalize}
        compressed={compressed}
        disabled={disabled}
        style={{ height: height }}
        className={styles.area}
      />
    </FormItem>
  );
}
