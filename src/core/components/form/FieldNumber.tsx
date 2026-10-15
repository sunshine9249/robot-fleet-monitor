import React from "react";
import {
  useWatch,
  FieldName,
  Controller,
  FieldValues,
  UseFormMethods,
} from "react-hook-form";
import { EuiFieldNumber, EuiI18n } from "@elastic/eui";

import { FormItem, FormItemProps } from "./FormItem";
import { toNumber } from "../../utils";
import classNames from "classnames";
import styles from "./FieldNumber.module.scss";
import { getFormHelpText } from "./FormHelpText";

export type FieldNumberProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> & {
  name: FieldName<T>;
  form: UseFormMethods<T>;
  defaultValue?: number | string | "";
  fullWidth?: boolean;

  value?: number | string | "";
  style?: React.CSSProperties;
  append?: string | JSX.Element | (string | JSX.Element)[];
  prepend?: string | JSX.Element;
  readOnly?: boolean;
  pattern?: RegExp;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  onChange?: (value: number | "") => void;
  disabled?: boolean;
  hidden?: boolean;
  isInvalid?: boolean;
  className?: string;
  maxLength?: number;
};

export function FieldNumber<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = "",
  fullWidth = true,
  value: valueProp,
  style,
  append,
  prepend,
  required,
  readOnly,
  pattern,
  placeholder,
  min,
  max,
  step,
  onChange: onChangeProp,
  disabled,
  hidden,
  className,
  maxLength = 100,
  isInvalid: isInvalidProp,
  helpText,
}: FieldNumberProps<T>) {
  const { control } = form;
  const value = useWatch<number>({ name, control });
  const isInvalid: boolean =
    isInvalidProp ||
    name in form.errors ||
    Boolean(value && value.toString().length >= maxLength);

  const computedHelpText = getFormHelpText(form.errors, name, {
    maxLength,
    max,
    min,
    step,
  });

  return (
    <FormItem
      label={label}
      fullWidth={fullWidth}
      isInvalid={isInvalid}
      style={hidden ? { display: "none" } : style}
      className={classNames(className, { [styles.invalid]: isInvalid })}
      required={required}
      helpText={computedHelpText ?? helpText}
      //   max && value > max ? (
      //     `입력하신 숫자는 ${max}를 초과할 수 없습니다.`
      //   ) : value && value.toString().length >= 100 ? (
      //     <EuiI18n
      //       token="app.input.helpText.limit"
      //       default="You cannot enter more than {maxLength} characters."
      //       values={{ maxLength }}
      //     />
      //   ) : (
      //     helpText
      //   )
    >
      <Controller
        render={({ onBlur, onChange, name, value }) => (
          <EuiFieldNumber
            name={name}
            value={valueProp ? valueProp : value}
            onBlur={onBlur}
            onChange={(event) => {
              const value = toNumber(event);
              onChange(value);
              if (typeof onChangeProp === "function") {
                onChangeProp(value);
              }
            }}
            fullWidth={fullWidth}
            isInvalid={isInvalid}
            append={append}
            prepend={prepend}
            aria-required={required}
            readOnly={readOnly}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={disabled}
            step={step}
          />
        )}
        control={form.control as any}
        rules={{
          required,
          pattern,
          maxLength,
          max,
          min,
          step,
        }}
        name={name}
        defaultValue={defaultValue}
      />
    </FormItem>
  );
}
