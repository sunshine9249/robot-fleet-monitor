import { useContext, useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldPassword,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import {
  Role,
  ToastContext,
  UserAddResource,
  UserContext,
  UserEditResource,
  UserFormData,
  UserListResource,
  UserViewResource,
} from "core";
import {
  ViewFlyout,
  ViewFlyoutBody,
  ViewFlyoutFooter,
  ViewFlyoutHeader,
} from "components/common/ViewFlyout";

interface UserFormFlyoutProps {
  basePath: string;
  mode: "add" | "edit";
  roles: Role[];
  userListResource: UserListResource;
  userViewResource: UserViewResource;
  userAddResource: UserAddResource | null;
  userEditResource: UserEditResource | null;
}

type Form = UserFormData & { passwordConfirm?: string };

const EMPTY: Form = {
  username: "",
  name: "",
  email: null,
  contact: null,
  jobPosition: null,
  roleId: 0,
  password: "",
  passwordConfirm: "",
};

export function UserFormFlyout({
  basePath,
  mode,
  roles,
  userListResource,
  userViewResource,
  userAddResource,
  userEditResource,
}: UserFormFlyoutProps) {
  const history = useHistory();
  const { userId } = useParams<{ userId?: string }>();
  const { addToast } = useContext(ToastContext);
  const { user: me } = useContext(UserContext);
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const { setUserId, data: user, loading } = userViewResource;

  useEffect(() => {
    if (mode === "edit" && userId) setUserId(Number(userId));
  }, [mode, userId, setUserId]);

  useEffect(() => {
    if (mode === "edit" && user && user.id === Number(userId)) {
      setForm({
        username: user.username,
        name: user.name,
        email: user.email,
        contact: user.contact,
        jobPosition: user.jobPosition,
        roleId: user.role.id,
      });
    }
  }, [mode, user, userId]);

  useEffect(() => {
    if (mode === "add" && !form.roleId && roles.length) {
      const fallback = roles.find((role) => !role.isSystem) ?? roles[0];
      setForm((previous) => ({ ...previous, roleId: fallback.id }));
    }
  }, [mode, roles, form.roleId]);

  const errors = useMemo(() => {
    const result: Partial<Record<keyof Form, string>> = {};
    if (!/^[a-z0-9_.-]{4,20}$/.test(form.username)) {
      result.username = "영문 소문자·숫자 4~20자로 입력해 주세요.";
    } else if (usernameTaken) {
      result.username = "이미 쓰고 있는 아이디입니다.";
    }
    if (!form.name.trim()) result.name = "이름을 입력해 주세요.";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      result.email = "이메일 형식이 아닙니다.";
    }
    if (!form.roleId) result.roleId = "권한을 골라 주세요.";
    if (mode === "add") {
      if (!form.password || form.password.length < 8) {
        result.password = "8자 이상 입력해 주세요.";
      }
      if (form.password !== form.passwordConfirm) {
        result.passwordConfirm = "비밀번호가 서로 다릅니다.";
      }
    }
    return result;
  }, [form, mode, usernameTaken]);

  const hasErrors = Object.keys(errors).length > 0;
  const resource = mode === "add" ? userAddResource : userEditResource;
  const show = (key: keyof Form) =>
    touched && errors[key] ? [errors[key] as string] : undefined;
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const close = () => history.push(basePath);
  const isMe = mode === "edit" && me?.id === Number(userId);

  const checkUsername = async () => {
    if (mode !== "add" || !userAddResource || !form.username) return;
    try {
      setUsernameTaken(!(await userAddResource.checkUsername(form.username)));
    } catch {
      setUsernameTaken(false);
    }
  };

  const submit = async () => {
    setTouched(true);
    if (hasErrors || !resource) return;
    const { passwordConfirm, ...payload } = form;
    try {
      if (mode === "add" && userAddResource) {
        await userAddResource.addUser(payload);
        addToast("success", { title: `${form.name} 님을 등록했습니다.` });
      } else if (userEditResource && userId) {
        const { password, ...rest } = payload;
        await userEditResource.editUser(Number(userId), rest);
        addToast("success", { title: `${form.name} 님 정보를 수정했습니다.` });
      }
      userListResource.reload();
      close();
    } catch {
      // 아래 콜아웃
    }
  };

  return (
    <ViewFlyout onClose={close} size={480} aria-labelledby="userFormTitle">
      <ViewFlyoutHeader
        id="userFormTitle"
        title={mode === "add" ? "사용자 등록" : "사용자 정보 수정"}
      />
      <ViewFlyoutBody>
        {mode === "edit" && loading && !user ? (
          <EuiLoadingSpinner size="l" />
        ) : (
          <EuiForm
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {resource?.error && (
              <EuiCallOut color="danger" size="s" title={resource.error} />
            )}
            <EuiFormRow
              label="아이디"
              isInvalid={Boolean(show("username"))}
              error={show("username")}
              fullWidth={true}
            >
              <EuiFieldText
                fullWidth={true}
                value={form.username}
                onChange={(event) => {
                  set("username", event.target.value.toLowerCase());
                  setUsernameTaken(false);
                }}
                onBlur={checkUsername}
                isInvalid={Boolean(show("username"))}
                autoComplete="off"
                maxLength={20}
              />
            </EuiFormRow>
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow
                  label="이름"
                  isInvalid={Boolean(show("name"))}
                  error={show("name")}
                >
                  <EuiFieldText
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    isInvalid={Boolean(show("name"))}
                    maxLength={30}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="직책">
                  <EuiFieldText
                    value={form.jobPosition ?? ""}
                    onChange={(event) =>
                      set("jobPosition", event.target.value || null)
                    }
                    maxLength={30}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFormRow
              label="권한"
              helpText={isMe ? "내 권한은 직접 바꿀 수 없습니다." : undefined}
              isInvalid={Boolean(show("roleId"))}
              error={show("roleId")}
              fullWidth={true}
            >
              <EuiSelect
                fullWidth={true}
                disabled={isMe}
                options={roles.map((role) => ({
                  value: String(role.id),
                  text: role.name,
                }))}
                value={String(form.roleId)}
                onChange={(event) => set("roleId", Number(event.target.value))}
              />
            </EuiFormRow>
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow
                  label="이메일"
                  isInvalid={Boolean(show("email"))}
                  error={show("email")}
                >
                  <EuiFieldText
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) =>
                      set("email", event.target.value || null)
                    }
                    isInvalid={Boolean(show("email"))}
                    maxLength={60}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="연락처">
                  <EuiFieldText
                    value={form.contact ?? ""}
                    onChange={(event) =>
                      set("contact", event.target.value || null)
                    }
                    placeholder="010-0000-0000"
                    maxLength={20}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            {mode === "add" && (
              <EuiFlexGroup gutterSize="m">
                <EuiFlexItem>
                  <EuiFormRow
                    label="비밀번호"
                    isInvalid={Boolean(show("password"))}
                    error={show("password")}
                  >
                    <EuiFieldPassword
                      type="dual"
                      value={form.password ?? ""}
                      onChange={(event) => set("password", event.target.value)}
                      isInvalid={Boolean(show("password"))}
                      autoComplete="new-password"
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFormRow
                    label="비밀번호 확인"
                    isInvalid={Boolean(show("passwordConfirm"))}
                    error={show("passwordConfirm")}
                  >
                    <EuiFieldPassword
                      type="dual"
                      value={form.passwordConfirm ?? ""}
                      onChange={(event) =>
                        set("passwordConfirm", event.target.value)
                      }
                      isInvalid={Boolean(show("passwordConfirm"))}
                      autoComplete="new-password"
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            <button type="submit" hidden={true} />
          </EuiForm>
        )}
      </ViewFlyoutBody>
      <ViewFlyoutFooter
        left={<EuiButtonEmpty onClick={close}>취소</EuiButtonEmpty>}
      >
        <EuiButton fill={true} onClick={submit} isLoading={resource?.loading}>
          {mode === "add" ? "등록" : "저장"}
        </EuiButton>
      </ViewFlyoutFooter>
    </ViewFlyout>
  );
}
