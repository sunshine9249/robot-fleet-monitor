import {
  EuiFieldSearch,
  EuiFormHelpText,
  EuiI18n,
  htmlIdGenerator,
} from "@elastic/eui";
import styles from "./SearchFilter.module.scss";
import { useState } from "react";
type SearchFilterProps = {
  label: string;
  query: string;
  setQuery: (value: string) => void;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  autofocus?: boolean;
  compressed?: boolean;
};

export default function SearchFilter({
  label,
  query,
  setQuery,
  fullWidth = true,
  onChange: onChangeProps,
  autofocus,
  compressed = true,
}: SearchFilterProps) {
  const searchInputId = useState(() => htmlIdGenerator()())[0];

  return (
    <div style={{ width: "100%" }}>
      <EuiFieldSearch
        placeholder={label}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (onChangeProps) onChangeProps(event.target.value);
        }}
        isClearable={query.length > 0}
        fullWidth={fullWidth}
        className={styles.input}
        maxLength={100}
        id={searchInputId}
        autoFocus={autofocus}
        compressed={compressed}
      />
      {query.length >= 100 && (
        <EuiFormHelpText>
          <EuiI18n
            token="app.input.helpText.limit"
            default="You cannot enter more than {maxLength} characters."
            values={{
              maxLength: 100,
            }}
          />
        </EuiFormHelpText>
      )}
    </div>
  );
}
