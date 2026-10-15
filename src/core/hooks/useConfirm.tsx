import { ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  EuiConfirmModal,
  EuiOutsideClickDetector,
  EuiOverlayMask,
  useEuiI18n,
} from "@elastic/eui";
import classNames from "classnames";
import styles from "./useConfirm.module.scss";
import { Icon } from "@iconify/react";
import { MD_SYMBOLS_ICONS } from "../../icons";

type Color = "success" | "accent" | "danger" | "warning" | "text" | "primary";
type ConfirmOptions = {
  title: string;
  body: string | ReactNode;
  color?: Color;
  confirmText?: string;
  cancelText?: string;
  autoClose?: number;
  confirmOnly?: boolean;
  onClickConfirm?: () => void;
  onCancel?: () => void;
  align?: "center" | "right" | "left";
  maxWidth?: number;
};

type ConfirmProps = ConfirmOptions & {
  onConfirm: (result: boolean) => void;
};

function Confirm({
  onConfirm,
  color = "danger",
  title,
  body,
  confirmText,
  cancelText,
  autoClose,
  confirmOnly = false,
  onClickConfirm,
  onCancel,
  maxWidth = 400,
  align = "left",
}: ConfirmOptions & ConfirmProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onConfirm(false);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onConfirm]);

  return (
    <EuiOverlayMask>
      <EuiConfirmModal
        title={title}
        titleProps={{ size: "s" }}
        onCancel={
          onCancel
            ? () => {
                onCancel();
                onConfirm(false);
              }
            : () => onConfirm(false)
        }
        onConfirm={() => {
          onConfirm(true);
          if (typeof onClickConfirm === "function") {
            onClickConfirm();
          }
        }}
        confirmButtonText={confirmText}
        cancelButtonText={confirmOnly ? undefined : cancelText}
        buttonColor={color}
        defaultFocusedButton="confirm"
        maxWidth={maxWidth}
        className={classNames(
          "confirmModal",
          styles.modal,
          styles[`color${color}`],
          styles[`align${align}`],
        )}
      >
        <div className={classNames(styles.body, styles[`align${align}`])}>
          {body}
        </div>
      </EuiConfirmModal>
    </EuiOverlayMask>
  );
}

export function SuccessConfirm({
  onConfirm,
}: {
  onConfirm: (result: boolean) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onConfirm(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onConfirm]);

  return (
    <EuiOverlayMask className={styles.successModalOverlay}>
      <EuiOutsideClickDetector onOutsideClick={() => onConfirm(true)}>
        <EuiConfirmModal
          title={
            <>
              <Icon
                icon={MD_SYMBOLS_ICONS.confirmCircleFilled}
                width={24}
                height={24}
                color="#7c77f4"
                style={{ marginBottom: 7 }}
              />
              <br />
              완료
            </>
          }
          titleProps={{ size: "s" }}
          onConfirm={() => onConfirm(true)}
          onCancel={() => onConfirm(false)}
          onClick={() => onConfirm(true)}
          className={classNames(
            "confirmModal",
            styles.modal,
            styles.successModal,
            styles.aligncenter,
          )}
        >
          <div className={classNames(styles.body, styles.aligncenter)}>
            완료되었습니다.
          </div>
        </EuiConfirmModal>
      </EuiOutsideClickDetector>
    </EuiOverlayMask>
  );
}

export function useConfirm() {
  const [confirmTextDefault, cancelTextDefault] = useEuiI18n(
    ["app.common.confirm", "app.common.cancel"],
    ["Confirm", "Cancel"],
  );

  return function confirm(options: ConfirmOptions | "success") {
    return new Promise<boolean>((resolve) => {
      const container = document.body.appendChild(
        document.createElement("div"),
      );
      const root = createRoot(container);

      function handleConfirm(result: boolean) {
        resolve(result);

        try {
          root.unmount();
          setTimeout(() => document.body.removeChild(container));
        } catch {}
      }

      try {
        root.render(
          options === "success" ? (
            <SuccessConfirm onConfirm={handleConfirm} />
          ) : (
            <Confirm
              confirmText={confirmTextDefault}
              cancelText={cancelTextDefault}
              {...options}
              onConfirm={handleConfirm}
            />
          ),
        );
      } catch {
        handleConfirm(false);
      }
    });
  };
}
