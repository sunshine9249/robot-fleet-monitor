import { useForm, Controller } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { AuthResource, EuiCustomButton, FormItem } from "core";
import {
  EuiPanel,
  EuiI18n,
  EuiText,
  EuiForm,
  EuiSpacer,
  EuiCheckbox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldPassword,
} from "@elastic/eui";

import { Logo } from "components/header/Logo";
import { SERVICE_NAME } from "../../config";
import styles from "./LoginForm.module.scss";

export type LoginFormProps = {
  authResource: AuthResource;
};

type LoginFormData = {
  username: string;
  password: string;
  remember: boolean;
};

export function LoginForm({ authResource }: LoginFormProps) {
  const history = useHistory();
  const { register, control, handleSubmit } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authResource.login(data.username, data.password, data.remember);
      history.push("/");
    } catch {
      // 실패 문구는 LoginView 가 authResource 의 에러로 그립니다
    }
  };

  return (
    <EuiPanel paddingSize="l" className={styles.content}>
      <header className={styles.header}>
        <div>
          <p className={styles.logo}>
            <Logo size={56} />
          </p>
        </div>
        <EuiSpacer size="s" />
        <EuiText size="m" className={styles.subtitle}>
          <h2>{SERVICE_NAME}</h2>
        </EuiText>
        <EuiText size="xs" color="subdued">
          실내 자율주행 로봇 관제 · 원격 제어 · 이벤트 대응
        </EuiText>
      </header>
      <EuiSpacer size="s" />
      <EuiForm component="form" onSubmit={handleSubmit(onSubmit)}>
        <FormItem
          fullWidth={true}
          label={<EuiI18n token="app.common.username" default="Username" />}
        >
          <EuiFieldText
            id="username"
            name="username"
            data-test-subj="loginUsername"
            disabled={authResource.loading}
            isInvalid={false}
            aria-required={true}
            inputRef={register({ required: true })}
            autoCapitalize="off"
          />
        </FormItem>
        <FormItem
          fullWidth={true}
          label={<EuiI18n token="app.common.password" default="Password" />}
          className={styles.passwordInput}
        >
          <EuiFieldPassword
            type="dual"
            id="password"
            name="password"
            data-test-subj="loginPassword"
            disabled={authResource.loading}
            isInvalid={false}
            aria-required={true}
            inputRef={register({ required: true })}
            autoCapitalize="off"
          />
        </FormItem>
        <EuiSpacer size="m" />
        <EuiFlexGroup>
          <EuiFlexItem grow={2}>
            <Controller
              render={({ onChange, onBlur, value }) => (
                <EuiCheckbox
                  id="remember"
                  label={
                    <EuiI18n token="app.login.remember" default="Remember me" />
                  }
                  onChange={(event) => onChange(event.target.checked)}
                  onBlur={onBlur}
                  checked={value}
                />
              )}
              name="remember"
              control={control}
              defaultValue={false}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={4}>
            <EuiCustomButton
              fill={true}
              type="submit"
              color="primary"
              isLoading={authResource.loading}
              data-test-subj="loginSubmit"
            >
              <EuiI18n token="app.common.login" default="Login" />
            </EuiCustomButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
    </EuiPanel>
  );
}
