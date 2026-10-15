import { useContext, useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiSelect,
  EuiSuperSelect,
  EuiTextArea,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import {
  RobotAddResource,
  RobotEditResource,
  RobotFormData,
  RobotListResource,
  RobotType,
  RobotTypeLabel,
  RobotViewResource,
  SiteMap,
  ToastContext,
} from "core";
import {
  ViewFlyout,
  ViewFlyoutBody,
  ViewFlyoutFooter,
  ViewFlyoutHeader,
} from "components/common/ViewFlyout";
import { RobotTypeText } from "components/common/robot";

interface RobotFormFlyoutProps {
  basePath: string;
  mode: "add" | "edit";
  site: SiteMap | null;
  robotListResource: RobotListResource;
  robotViewResource: RobotViewResource;
  robotAddResource: RobotAddResource | null;
  robotEditResource: RobotEditResource | null;
}

const EMPTY: RobotFormData = {
  name: "",
  serialNo: "",
  type: RobotType.Delivery,
  manufacturer: "",
  model: "",
  firmwareVersion: "",
  homeFloorId: 0,
  dockId: 0,
  installedAt: new Date().toISOString().slice(0, 10),
  memo: null,
};

type Errors = Partial<Record<keyof RobotFormData, string>>;

function validate(form: RobotFormData): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "이름을 입력해 주세요.";
  else if (!/^[A-Za-z0-9-]{2,20}$/.test(form.name.trim())) {
    errors.name = "영문·숫자·하이픈 2~20자로 입력해 주세요. (예: DLV-05)";
  }
  if (!form.serialNo.trim()) errors.serialNo = "시리얼 번호를 입력해 주세요.";
  if (!form.dockId) errors.dockId = "충전 스테이션을 골라 주세요.";
  if (!form.installedAt) errors.installedAt = "설치일을 입력해 주세요.";
  return errors;
}

export function RobotFormFlyout({
  basePath,
  mode,
  site,
  robotListResource,
  robotViewResource,
  robotAddResource,
  robotEditResource,
}: RobotFormFlyoutProps) {
  const history = useHistory();
  const { robotId } = useParams<{ robotId?: string }>();
  const { addToast } = useContext(ToastContext);
  const [form, setForm] = useState<RobotFormData>(EMPTY);
  const [touched, setTouched] = useState(false);
  const { setRobotId, data: robot, loading } = robotViewResource;

  useEffect(() => {
    if (mode === "edit" && robotId) setRobotId(Number(robotId));
  }, [mode, robotId, setRobotId]);

  useEffect(() => {
    if (mode === "edit" && robot && robot.id === Number(robotId)) {
      const {
        id,
        createdAt,
        overallStatus,
        state,
        battery,
        floorId,
        todayMissionCount,
        odometerKm,
        openEventCount,
        ...rest
      } = robot;
      setForm(rest);
    }
  }, [mode, robot, robotId]);

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const resource = mode === "add" ? robotAddResource : robotEditResource;
  const serverError = resource?.error;

  const dockOptions = useMemo(
    () =>
      (site?.docks ?? []).map((dock) => {
        const floor = site?.floors.find((item) => item.id === dock.floorId);
        return {
          value: String(dock.id),
          inputDisplay: `${dock.name} · ${floor?.name ?? ""} ${floor?.label ?? ""}`,
        };
      }),
    [site],
  );

  const set = <K extends keyof RobotFormData>(
    key: K,
    value: RobotFormData[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const close = () => history.push(basePath);

  const submit = async () => {
    setTouched(true);
    if (hasErrors || !resource) return;
    const dock = site?.docks.find((item) => item.id === form.dockId);
    const payload: RobotFormData = {
      ...form,
      name: form.name.trim().toUpperCase(),
      homeFloorId: dock?.floorId ?? form.homeFloorId,
      memo: form.memo?.trim() || null,
    };
    try {
      if (mode === "add" && robotAddResource) {
        const created = await robotAddResource.addRobot(payload);
        addToast("success", { title: `${created.name} 을(를) 등록했습니다.` });
      } else if (robotEditResource && robotId) {
        await robotEditResource.editRobot(Number(robotId), payload);
        addToast("success", { title: `${payload.name} 정보를 수정했습니다.` });
      }
      robotListResource.reload();
      close();
    } catch {
      // 문구는 아래 콜아웃이 보여 줍니다
    }
  };

  const showError = (key: keyof RobotFormData) =>
    touched && errors[key] ? [errors[key] as string] : undefined;

  return (
    <ViewFlyout onClose={close} size={520} aria-labelledby="robotFormTitle">
      <ViewFlyoutHeader
        id="robotFormTitle"
        title={mode === "add" ? "로봇 등록" : `${robot?.name ?? ""} 정보 수정`}
        subtitle={
          mode === "add"
            ? "등록하면 바로 지정한 충전 스테이션에서 운행을 시작합니다."
            : undefined
        }
      />
      <ViewFlyoutBody>
        {mode === "edit" && loading && !robot ? (
          <EuiLoadingSpinner size="l" />
        ) : (
          <EuiForm
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {serverError && (
              <EuiCallOut color="danger" size="s" title={serverError} />
            )}
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow
                  label="이름"
                  isInvalid={Boolean(showError("name"))}
                  error={showError("name")}
                  helpText="화면에 보이는 이름입니다."
                >
                  <EuiFieldText
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    isInvalid={Boolean(showError("name"))}
                    placeholder="DLV-05"
                    maxLength={20}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="종류">
                  <EuiSelect
                    options={Object.values(RobotType).map((type) => ({
                      value: type,
                      text: RobotTypeLabel[type],
                    }))}
                    value={form.type}
                    onChange={(event) =>
                      set("type", event.target.value as RobotType)
                    }
                    prepend={
                      <span style={{ padding: "0 8px", display: "flex" }}>
                        <RobotTypeText type={form.type} iconOnly={true} />
                      </span>
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow label="제조사">
                  <EuiFieldText
                    value={form.manufacturer}
                    onChange={(event) =>
                      set("manufacturer", event.target.value)
                    }
                    maxLength={40}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="모델">
                  <EuiFieldText
                    value={form.model}
                    onChange={(event) => set("model", event.target.value)}
                    maxLength={40}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem>
                <EuiFormRow
                  label="시리얼 번호"
                  isInvalid={Boolean(showError("serialNo"))}
                  error={showError("serialNo")}
                >
                  <EuiFieldText
                    value={form.serialNo}
                    onChange={(event) => set("serialNo", event.target.value)}
                    isInvalid={Boolean(showError("serialNo"))}
                    maxLength={40}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="펌웨어 버전">
                  <EuiFieldText
                    value={form.firmwareVersion}
                    onChange={(event) =>
                      set("firmwareVersion", event.target.value)
                    }
                    placeholder="1.0.0"
                    maxLength={20}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiFormRow
              label="충전 스테이션"
              helpText="로봇이 대기·충전하는 곳입니다. 스테이션이 있는 층이 기본 층이 됩니다."
              isInvalid={Boolean(showError("dockId"))}
              error={showError("dockId")}
              fullWidth={true}
            >
              <EuiSuperSelect
                fullWidth={true}
                options={dockOptions}
                valueOfSelected={form.dockId ? String(form.dockId) : ""}
                placeholder="충전 스테이션 선택"
                onChange={(value) => set("dockId", Number(value))}
                isInvalid={Boolean(showError("dockId"))}
              />
            </EuiFormRow>

            <EuiFormRow
              label="설치일"
              isInvalid={Boolean(showError("installedAt"))}
              error={showError("installedAt")}
            >
              <EuiFieldText
                type="date"
                value={form.installedAt}
                onChange={(event) => set("installedAt", event.target.value)}
              />
            </EuiFormRow>

            <EuiFormRow label="메모" fullWidth={true}>
              <EuiTextArea
                fullWidth={true}
                rows={3}
                value={form.memo ?? ""}
                onChange={(event) => set("memo", event.target.value)}
                maxLength={300}
              />
            </EuiFormRow>
            <button type="submit" hidden={true} />
          </EuiForm>
        )}
      </ViewFlyoutBody>
      <ViewFlyoutFooter
        left={<EuiButtonEmpty onClick={close}>취소</EuiButtonEmpty>}
      >
        <EuiButton
          fill={true}
          onClick={submit}
          isLoading={resource?.loading}
          isDisabled={touched && hasErrors}
        >
          {mode === "add" ? "등록" : "저장"}
        </EuiButton>
      </ViewFlyoutFooter>
    </ViewFlyout>
  );
}
