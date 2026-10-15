import { useContext } from "react";
import moment from "moment";
import { EuiDatePicker, EuiPopover, EuiText, EuiI18n } from "@elastic/eui";
import {
  FieldName,
  Controller,
  FieldValues,
  UseFormMethods,
} from "react-hook-form";
import { FormItem, FormItemProps } from "./FormItem";
import classNames from "classnames";
import { LocaleContext } from "../../contexts/LocaleContext";

export type DatePickerProps<T extends FieldValues> = Omit<
  FormItemProps,
  "children"
> & {
  name: FieldName<T>;
  form: UseFormMethods<T>;
  defaultValue?: moment.Moment | null;
  dateFormat?: string;
  showTimeSelect?: boolean;
  showTimeSelectOnly?: boolean;
  locale?: string;
  fullWidth?: boolean;
  onClear?: () => void;
  placeholder?: string;
  inline?: boolean;
  minDate?: moment.Moment;
  maxDate?: moment.Moment;
  minTime?: moment.Moment;
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  onChange?: (value: moment.Moment) => void;
  shadow?: boolean;
  disabled?: boolean;
  shouldCloseOnSelect?: boolean;
  isStartEndInvalid?: boolean;
  required?: boolean;
  anchorClassName?: string;
  className?: string;
};

export function DatePicker<T extends FieldValues>({
  name,
  label,
  form,
  defaultValue = moment(),
  dateFormat = "YYYY.MM.DD HH:mm",
  showTimeSelect = true,
  showTimeSelectOnly = false,
  locale,
  fullWidth = true,
  onClear,
  placeholder,
  inline,
  minDate,
  minTime,
  maxDate,
  startDate,
  endDate,
  onChange: onChangeProp,
  shadow,
  disabled,
  shouldCloseOnSelect,
  isStartEndInvalid = false,
  required = false,
  anchorClassName,
  className,
  helpText,
}: DatePickerProps<T>) {
  const localePreFix = useContext(LocaleContext)[0];

  return (
    <EuiPopover
      isOpen={isStartEndInvalid}
      panelPaddingSize="s"
      anchorPosition="downLeft"
      className={classNames(className)}
      closePopover={() => {}}
      button={
        <FormItem
          label={label}
          fullWidth={fullWidth}
          className={className}
          required={required}
          isInvalid={name in form.errors || isStartEndInvalid}
          helpText={helpText}
        >
          <Controller
            render={({ onChange, onBlur, value }) => {
              function handleChange(value: moment.Moment) {
                onChange(value);
                if (typeof onChangeProp === "function") {
                  onChangeProp(value);
                }
              }

              function onClearValue() {
                if (typeof onClear === "function") {
                  onClear();
                } else {
                  onChange(null);
                }
              }

              return (
                <EuiDatePicker
                  dateFormat={dateFormat}
                  showTimeSelect={showTimeSelect}
                  showTimeSelectOnly={showTimeSelectOnly}
                  locale={locale ? locale : localePreFix}
                  fullWidth={fullWidth}
                  onChange={handleChange}
                  onBlur={onBlur}
                  selected={value}
                  onClear={!required && !disabled ? onClearValue : undefined}
                  placeholder={placeholder}
                  inline={inline}
                  minDate={minDate}
                  minTime={minTime}
                  maxDate={maxDate}
                  startDate={startDate}
                  endDate={endDate}
                  shadow={shadow}
                  disabled={disabled}
                  shouldCloseOnSelect={shouldCloseOnSelect}
                  required={required}
                  isInvalid={name in form.errors || isStartEndInvalid}
                />
              );
            }}
            control={form.control as any}
            name={name}
            defaultValue={defaultValue}
            rules={{
              required,
              validate: {
                nullVaildation: (value: moment.Moment) =>
                  required ? value !== null : undefined,
                minDateVaildation: (value: moment.Moment) =>
                  minDate
                    ? moment(value).unix() > moment(minDate).unix()
                    : undefined,
                maxDateVaildation: (value: moment.Moment) =>
                  maxDate
                    ? moment(value).unix() < moment(maxDate).unix()
                    : undefined,
              },
            }}
          />
        </FormItem>
      }
    >
      <EuiText color="danger" size="s">
        <EuiI18n
          token="app.common.DatePickRangeError"
          default="End date can't be eariler than Start date"
        />
      </EuiText>
    </EuiPopover>
  );
}
