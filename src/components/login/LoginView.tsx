import { EuiSpacer, EuiCallOut, EuiText } from "@elastic/eui";

import { LoginForm } from "components/login/LoginForm";
import { AuthResource } from "core";
import styles from "./LoginView.module.scss";

export type LoginViewProps = {
  authResource: AuthResource;
};

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin1234", role: "관리자" },
  { username: "operator", password: "operator1234", role: "운영자" },
  { username: "viewer", password: "viewer1234", role: "조회 전용" },
];

export function LoginView({ authResource }: LoginViewProps) {
  const { error, errorResponse } = authResource;
  let errorMessage: string | null = null;
  if (errorResponse) {
    errorMessage = errorResponse.message;
  } else if (
    error?.message === "Failed to fetch" ||
    error?.message === "Gateway Timeout"
  ) {
    errorMessage = "서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.";
  } else if (error) {
    errorMessage = error.message;
  }

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} aria-hidden="true">
        <svg
          className={styles.routes}
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <path d="M-20 620 H340 V380 H760 V180 H1220" />
          <path d="M-20 300 H220 V520 H620 V700 H1220" />
          <path d="M480 -20 V260 H980 V820" />
          <circle cx="340" cy="380" r="7" />
          <circle cx="760" cy="180" r="7" />
          <circle cx="620" cy="520" r="7" />
          <circle cx="980" cy="260" r="7" />
        </svg>
      </div>

      <div className={styles.contentWrap}>
        {errorMessage && (
          <>
            <EuiCallOut
              size="s"
              color="danger"
              data-test-subj="loginErrorMessage"
              title={errorMessage}
              role="alert"
            />
            <EuiSpacer size="l" />
          </>
        )}
        <LoginForm authResource={authResource} />
        <div className={styles.demoBox}>
          <EuiText size="xs">
            <strong>데모 계정</strong> — 서버 없이 브라우저 안의 시뮬레이터로
            돌아갑니다.
          </EuiText>
          <ul className={styles.demoList}>
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.username}>
                <code>{account.username}</code> /{" "}
                <code>{account.password}</code>
                <span>{account.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
