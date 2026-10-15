import React, { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  EuiButtonEmpty,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  htmlIdGenerator,
  useEuiI18n,
} from "@elastic/eui";
import { EuiCustomButton } from "../components/eui/EuiCustomButton";

type PromptOptions = {
  title: string;
  label: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
};

type PromptProps = PromptOptions & {
  onPrompt: (result: string | null) => void;
};

function Prompt({
  onPrompt,
  title,
  label,
  defaultValue = "",
  submitText,
  cancelText,
}: PromptOptions & PromptProps) {
  const inputName = useState(() => htmlIdGenerator()())[0];
  const [text, setText] = useState<string>(defaultValue);

  const handleSubmit = useCallback(() => onPrompt(text), [onPrompt, text]);
  const handleClose = useCallback(() => onPrompt(null), [onPrompt]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setText(event.currentTarget.value);
    },
    [],
  );

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        onPrompt(event.currentTarget.value);
      }
    },
    [onPrompt],
  );

  return (
    <EuiOverlayMask>
      <EuiModal onClose={handleClose} initialFocus={`[name=${inputName}]`}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm>
            <EuiFormRow label={label}>
              <EuiFieldText
                name={inputName}
                value={text}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
              />
            </EuiFormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={handleClose}>{cancelText}</EuiButtonEmpty>
          <EuiCustomButton onClick={handleSubmit} fill={true}>
            {submitText}
          </EuiCustomButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}

export function usePrompt() {
  const [submitTextDefault, cancelTextDefault] = useEuiI18n(
    ["app.common.confirm", "app.common.cancel"],
    ["Confirm", "Cancel"],
  );

  return function prompt(options: PromptOptions) {
    return new Promise<string | null>((resolve) => {
      const container = document.body.appendChild(
        document.createElement("div"),
      );
      const root = createRoot(container);

      function handlePrompt(result: string | null) {
        resolve(result);

        try {
          root.unmount();
          setTimeout(() => document.body.removeChild(container));
        } catch {}
      }

      try {
        root.render(
          <Prompt
            submitText={submitTextDefault}
            cancelText={cancelTextDefault}
            {...options}
            onPrompt={handlePrompt}
          />,
        );
      } catch {
        handlePrompt(null);
      }
    });
  };
}
