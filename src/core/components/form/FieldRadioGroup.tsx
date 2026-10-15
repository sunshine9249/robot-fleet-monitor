import { EuiRadioGroupProps } from "@elastic/eui";

import {
  useWatch,
  FieldName,
  Controller,
  FieldValues,
  UseFormMethods,
} from "react-hook-form";
import classNames from "classnames";
import { FormItem, FormItemProps } from "./FormItem";
import styles from "./FieldRadioGroup.module.scss";
import { EuiRadioGroupInline } from "../eui";

export type FieldRadioGroupProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> &
  Omit<EuiRadioGroupProps, "onChange"> & {
    name: FieldName<T>;
    form: UseFormMethods<T>;
    defaultValue?: string;
    fullWidth?: boolean;
    append?: JSX.Element;
    prepend?: JSX.Element;
    readOnly?: boolean;
    pattern?: RegExp;
    validate?: (str: string) => boolean;
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

export function FieldRadioGroup<T extends FieldValues>({
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
  hidden,
  placeholder,
  type,
  className,
  autoCapitalize,
  compressed,
  disabled,
  maxLength = 100,
  onClick,
  options,
  isInvalid: isInvalidProp,
  autoFocus = false,
}: FieldRadioGroupProps<T>) {
  const {
    formState: { errors, isDirty, isSubmitting, touchedFields, submitCount },
    control,
  } = form;
  const value = useWatch<string>({ name, control });
  const isInvalid: boolean =
    isInvalidProp ||
    name in form.errors ||
    (value && value.length >= maxLength);

  return (
    <FormItem
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      style={hidden ? { display: "none" } : undefined}
      className={classNames(className, { [styles.invalid]: isInvalid })}
      required={required}
      // helpText={}
    >
      <Controller
        render={({ onChange, name, value }) => (
          <EuiRadioGroupInline
            options={options}
            idSelected={value}
            onChange={onChange}
            name={name}
            aria-label=""
            // legend={{
            //   children: (
            //     <EuiI18n
            //       token="app.contract.isFree"
            //       default="isFree"
            //     />
            //   ),
            // }}
          />
        )}
        form={form}
        control={control}
        rules={{ required }}
        name={name}
        defaultValue={
          defaultValue ? defaultValue : required ? options[0].id : undefined
        }
      />
      {/* <EuiFieldRadioGroup
        name={name}
        aria-required={required}
        inputRef={form.register({
          required,
          pattern,
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
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        autoCapitalize={autoCapitalize}
        compressed={compressed}
        disabled={disabled}
        onClick={onClick}
        autoFocus={autoFocus}
      /> */}
    </FormItem>
  );
}
