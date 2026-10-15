import { EuiPage, EuiPageBody, EuiEmptyPrompt } from "@elastic/eui";
import { registerPage } from "core";

export const NotFoundPage = registerPage(
  {
    title: "",
    path: "*",
    resources: [],
    excludeFromSwitch: true,
  },
  () => (
    <EuiPage style={{ height: "100%" }}>
      <EuiPageBody>
        <EuiEmptyPrompt
          iconType="warning"
          iconColor="danger"
          title={<h2>페이지를 찾을 수 없습니다</h2>}
          body={
            <p>
              주소가 바뀌었거나 없는 화면입니다. 위 메뉴에서 다시 골라 주세요.
            </p>
          }
          hasBorder={false}
        />
      </EuiPageBody>
    </EuiPage>
  ),
);
