import { EuiButton, EuiEmptyPrompt } from "@elastic/eui";
import { auth } from "../utils/auth";

/** 로그인은 됐는데 사용자 정보를 못 받았을 때 */
export function UserLoadError({
  error,
}: {
  error: { message: string } | null;
}) {
  return (
    <EuiEmptyPrompt
      style={{ marginTop: "20vh" }}
      iconType="alert"
      color="danger"
      title={<h2>사용자 정보를 불러오지 못했습니다</h2>}
      body={<p>{error?.message ?? "잠시 후 다시 시도해 주세요."}</p>}
      actions={
        <EuiButton
          fill={true}
          onClick={() =>
            auth
              .logout()
              .catch(() => undefined)
              .finally(() => {
                window.location.href = "/login";
              })
          }
        >
          다시 로그인
        </EuiButton>
      }
    />
  );
}
