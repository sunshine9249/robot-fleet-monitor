import { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiDescriptionList,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import {
  PasswordChangeResource,
  PersonalEditResource,
  ToastContext,
  UserContext,
} from "core";
import { PageShell } from "components/common/PageShell";
import styles from "./PersonalView.module.scss";

interface PersonalViewProps {
  personalEditResource: PersonalEditResource | null;
  passwordChangeResource: PasswordChangeResource | null;
}

export function PersonalView({
  personalEditResource,
  passwordChangeResource,
}: PersonalViewProps) {
  const history = useHistory();
  const location = useLocation<{ returnTo?: string }>();
  const { user, setUser } = useContext(UserContext);
  const { addToast } = useContext(ToastContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact: "",
    jobPosition: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email ?? "",
        contact: user.contact ?? "",
        jobPosition: user.jobPosition ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  const saveProfile = async () => {
    if (!personalEditResource || !profile.name.trim()) return;
    try {
      const updated = await personalEditResource.updateMe({
        name: profile.name.trim(),
        email: profile.email.trim() || null,
        contact: profile.contact.trim() || null,
        jobPosition: profile.jobPosition.trim() || null,
      });
      setUser(updated);
      addToast("success", { title: "내 정보를 저장했습니다." });
    } catch {
      // 콜아웃으로 보여 줍니다
    }
  };

  const passwordError =
    passwords.next && passwords.next.length < 8
      ? "8자 이상 입력해 주세요."
      : passwords.confirm && passwords.next !== passwords.confirm
        ? "새 비밀번호가 서로 다릅니다."
        : null;

  const changePassword = async () => {
    if (
      !passwordChangeResource ||
      passwordError ||
      !passwords.current ||
      !passwords.next
    ) {
      return;
    }
    try {
      await passwordChangeResource.changePassword(
        passwords.current,
        passwords.next,
      );
      setPasswords({ current: "", next: "", confirm: "" });
      addToast("success", { title: "비밀번호를 바꿨습니다." });
    } catch {
      // 콜아웃으로 보여 줍니다
    }
  };

  return (
    <PageShell
      title="계정 설정"
      description="내 정보와 비밀번호를 바꿉니다."
      actions={
        location.state?.returnTo && (
          <EuiButtonEmpty
            iconType="arrowLeft"
            onClick={() => history.push(location.state?.returnTo ?? "/")}
          >
            돌아가기
          </EuiButtonEmpty>
        )
      }
    >
      <div className={styles.grid}>
        <section>
          <EuiTitle size="xs">
            <h2>내 정보</h2>
          </EuiTitle>
          <EuiSpacer size="m" />
          <EuiDescriptionList
            compressed={true}
            type="column"
            columnWidths={[1, 3]}
            listItems={[
              { title: "아이디", description: user.username },
              { title: "권한", description: user.role.name },
            ]}
          />
          <EuiSpacer size="m" />
          <EuiForm
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              saveProfile();
            }}
          >
            {personalEditResource?.error && (
              <EuiCallOut
                color="danger"
                size="s"
                title={personalEditResource.error}
              />
            )}
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow label="이름">
                  <EuiFieldText
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({ ...profile, name: event.target.value })
                    }
                    readOnly={!personalEditResource}
                    maxLength={30}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="직책">
                  <EuiFieldText
                    value={profile.jobPosition}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        jobPosition: event.target.value,
                      })
                    }
                    readOnly={!personalEditResource}
                    maxLength={30}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow label="이메일">
                  <EuiFieldText
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile({ ...profile, email: event.target.value })
                    }
                    readOnly={!personalEditResource}
                    maxLength={60}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="연락처">
                  <EuiFieldText
                    value={profile.contact}
                    onChange={(event) =>
                      setProfile({ ...profile, contact: event.target.value })
                    }
                    readOnly={!personalEditResource}
                    maxLength={20}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            {personalEditResource ? (
              <EuiButton
                type="submit"
                fill={true}
                isLoading={personalEditResource.loading}
              >
                저장
              </EuiButton>
            ) : (
              <p className={styles.note}>
                내 정보를 바꿀 권한이 없습니다. 관리자에게 요청해 주세요.
              </p>
            )}
          </EuiForm>
        </section>

        <section>
          <EuiTitle size="xs">
            <h2>비밀번호 변경</h2>
          </EuiTitle>
          <EuiSpacer size="m" />
          {passwordChangeResource ? (
            <EuiForm
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                changePassword();
              }}
            >
              {passwordChangeResource.error && (
                <EuiCallOut
                  color="danger"
                  size="s"
                  title={passwordChangeResource.error}
                />
              )}
              <EuiFormRow label="현재 비밀번호">
                <EuiFieldPassword
                  type="dual"
                  value={passwords.current}
                  onChange={(event) =>
                    setPasswords({ ...passwords, current: event.target.value })
                  }
                  autoComplete="current-password"
                />
              </EuiFormRow>
              <EuiFormRow
                label="새 비밀번호"
                isInvalid={Boolean(passwordError)}
                error={passwordError ? [passwordError] : undefined}
              >
                <EuiFieldPassword
                  type="dual"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords({ ...passwords, next: event.target.value })
                  }
                  autoComplete="new-password"
                />
              </EuiFormRow>
              <EuiFormRow label="새 비밀번호 확인">
                <EuiFieldPassword
                  type="dual"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords({ ...passwords, confirm: event.target.value })
                  }
                  autoComplete="new-password"
                />
              </EuiFormRow>
              <EuiSpacer size="m" />
              <EuiButton
                type="submit"
                isLoading={passwordChangeResource.loading}
                isDisabled={
                  !passwords.current ||
                  !passwords.next ||
                  Boolean(passwordError)
                }
              >
                비밀번호 변경
              </EuiButton>
            </EuiForm>
          ) : (
            <p className={styles.note}>비밀번호를 바꿀 권한이 없습니다.</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}
