import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useHistory } from "react-router-dom";
import { EuiModal, EuiTitle, EuiModalProps } from "@elastic/eui";
import classNames from "classnames";
import styles from "./ViewModal.module.scss";

export type ViewModalLHProps = Omit<
  EuiModalProps,
  "onClose" | "fullWidth" | "fullHeight"
> & {
  onClose?: (() => void) | string;
  fullWidth?: boolean;
  fullHeight?: boolean;
  minWidth?: boolean;
  minHeight?: boolean;
};

export function ViewModal(props: ViewModalLHProps) {
  const {
    onClose,
    children,
    className,
    fullWidth = true,
    fullHeight = true,
    minWidth = true,
    minHeight = true,
    maxWidth,
    ...rest
  } = props;
  const history = useHistory();
  const handleClose = useCallback(() => {
    if (onClose) {
      if (typeof onClose === "string") {
        history.push(onClose);
      } else {
        onClose();
      }
    } else {
      history.goBack();
    }
  }, [history, onClose]);

  return (
    <EuiModal
      {...rest}
      maxWidth={maxWidth}
      id="ViewModal_Modal"
      onClose={handleClose}
      className={classNames(
        styles.container,
        styles[`fullWidth${fullWidth}`],
        styles[`fullHeight${fullHeight}`],
        styles[`minWidth${minWidth}`],
        styles[`minHeight${minHeight}`],
        className,
      )}
    >
      {children}
    </EuiModal>
  );
}

type ViewModalHeaderProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "title"
> & {
  title?: React.ReactNode | string;
  helpText?: React.ReactNode;
};
export function ViewModalHeader(props: ViewModalHeaderProps) {
  const { title, helpText, ...rest } = props;
  return (
    <div
      {...rest}
      title={undefined}
      className={classNames(styles.header, props.className)}
    >
      {title && (
        <EuiTitle size="xs">
          <h2>{title}&nbsp;</h2>
        </EuiTitle>
      )}
      {props.children} {helpText}
    </div>
  );
}

type ViewModalBodyProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "paddingBlock"
> & {
  paddingblock?: "none";
  paddinginline?: "none";
  flexdirection?: "row" | "row-reverse" | "column" | "column-reverse";
};
export function ViewModalBody(props: ViewModalBodyProps) {
  const { paddingblock, paddinginline, flexdirection = "row" } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div
      {...props}
      className={classNames(
        styles.body,
        styles[`flexdirection${flexdirection}`],
        {
          [styles.paddingblock]: paddingblock === "none",
          [styles.paddinginline]: paddinginline === "none",
        },
        props.className,
      )}
      ref={ref}
    >
      {props.children}
    </div>
  );
}

type ViewModalFooterProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;
export function ViewModalFooter(props: ViewModalFooterProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;

    const modal = footer.closest("#ViewModal_Modal");
    if (!modal) return;

    const observer = new ResizeObserver(() => {
      const isVisible = footer.offsetParent !== null;
      if (isVisible) {
        modal.classList.add("ViewModal_includeFooter");
      } else {
        modal.classList.remove("ViewModal_includeFooter");
      }
    });

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      {...props}
      className={classNames(styles.footer, props.className)}
      ref={ref}
    >
      {props.children}
    </div>
  );
}

export function FlowRight(props) {
  return <div className={styles.flowRight}>{props.children}</div>;
}
