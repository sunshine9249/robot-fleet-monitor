import { memo, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { EuiButton, EuiToolTip } from "@elastic/eui";
import {
  RobotCommand,
  RobotCommandResource,
  RobotCommandLabel,
  RobotState,
  RobotTelemetry,
  useConfirm,
} from "core";
import { MD_SYMBOLS_ICONS } from "../../icons";

interface RobotControlBarProps {
  robotName: string;
  telemetry: RobotTelemetry | undefined;
  commandResource: RobotCommandResource | null;
  onResult: (ok: boolean, message: string) => void;
}

const ICON: Record<RobotCommand, typeof MD_SYMBOLS_ICONS.pause> = {
  [RobotCommand.Hold]: MD_SYMBOLS_ICONS.stop,
  [RobotCommand.Resume]: MD_SYMBOLS_ICONS.play,
  [RobotCommand.ReturnToDock]: MD_SYMBOLS_ICONS.home,
  [RobotCommand.Reset]: MD_SYMBOLS_ICONS.restart,
};

/**
 * 버튼 아이콘 컴포넌트. 렌더 안에서 `() => <Icon />` 로 만들면 렌더마다 새 컴포넌트 타입이
 * 되어 EUI 가 아이콘을 매번 지웠다 다시 만듭니다. 실시간 값이 1초에 4번 들어오는
 * 화면이라 그게 그대로 깜박임이 되므로, 한 번만 만들어 둡니다.
 */
const COMMAND_ICON = Object.fromEntries(
  Object.entries(ICON).map(([command, icon]) => [
    command,
    function CommandIcon() {
      return <Icon icon={icon} width={16} height={16} />;
    },
  ]),
) as Record<RobotCommand, () => JSX.Element>;

/** 지금 상태에서 누를 수 있는 명령 */
function availableCommands(telemetry: RobotTelemetry | undefined) {
  if (!telemetry?.online) return new Set<RobotCommand>();
  const state = telemetry.state;
  const set = new Set<RobotCommand>();
  if (state === RobotState.EmergencyStop || state === RobotState.Error) {
    set.add(RobotCommand.Reset);
    return set;
  }
  if (state === RobotState.Held || state === RobotState.Paused) {
    set.add(RobotCommand.Resume);
  }
  if (state !== RobotState.Held && state !== RobotState.RidingElevator) {
    set.add(RobotCommand.Hold);
  }
  if (state !== RobotState.RidingElevator && telemetry.missionId !== null) {
    set.add(RobotCommand.ReturnToDock);
  }
  if (
    state === RobotState.Held ||
    (state === RobotState.Moving && telemetry.missionId === null)
  ) {
    set.add(RobotCommand.ReturnToDock);
  }
  return set;
}

const CONFIRM: Record<RobotCommand, { title: string; body: string }> = {
  [RobotCommand.Hold]: {
    title: "원격 정지",
    body: "로봇이 그 자리에 멈춥니다. 하던 임무는 [재개]를 누르면 이어서 합니다.",
  },
  [RobotCommand.Resume]: {
    title: "재개",
    body: "멈춘 자리에서 하던 일을 이어서 합니다.",
  },
  [RobotCommand.ReturnToDock]: {
    title: "충전 스테이션으로 복귀",
    body: "진행 중인 임무를 취소하고 충전 스테이션으로 돌아갑니다.",
  },
  [RobotCommand.Reset]: {
    title: "오류 해제",
    body: "현장에서 로봇 주변이 안전한지 확인했나요? 해제하면 로봇이 충전 스테이션으로 돌아갑니다.",
  },
};

interface ControlButtonProps {
  command: RobotCommand;
  enabled: boolean;
  offline: boolean;
  busy: boolean;
  onRun: (command: RobotCommand) => void;
}

/** 값이 그대로면 다시 그리지 않는 버튼 (실시간 값이 바뀌어도 눌릴 수 있는지는 거의 안 바뀝니다) */
const ControlButton = memo(function ControlButton({
  command,
  enabled,
  offline,
  busy,
  onRun,
}: ControlButtonProps) {
  const button = (
    <EuiButton
      size="s"
      color={command === RobotCommand.Reset ? "danger" : "primary"}
      fill={command === RobotCommand.Reset && enabled}
      isDisabled={!enabled || busy}
      onClick={() => onRun(command)}
      iconType={COMMAND_ICON[command]}
    >
      {RobotCommandLabel[command]}
    </EuiButton>
  );
  return enabled ? (
    button
  ) : (
    <EuiToolTip
      content={
        offline
          ? "통신이 끊겨 명령을 보낼 수 없습니다"
          : "지금 상태에서는 쓸 수 없습니다"
      }
    >
      {button}
    </EuiToolTip>
  );
});

/** 원격 제어 버튼 묶음. 권한이 없으면 아무것도 그리지 않습니다 */
export function RobotControlBar({
  robotName,
  telemetry,
  commandResource,
  onResult,
}: RobotControlBarProps) {
  const confirm = useConfirm();
  // 버튼에는 항상 같은 함수를 넘겨 둡니다 (최신 run 은 ref 로 따라갑니다)
  const runRef = useRef<(command: RobotCommand) => Promise<void>>();
  const handleRun = useCallback((command: RobotCommand) => {
    void runRef.current?.(command);
  }, []);
  if (!commandResource) return null;
  const available = availableCommands(telemetry);
  const order = [
    RobotCommand.Reset,
    RobotCommand.Resume,
    RobotCommand.Hold,
    RobotCommand.ReturnToDock,
  ];

  const run = async (command: RobotCommand) => {
    const ok = await confirm({
      title: `${robotName} ${CONFIRM[command].title}`,
      body: CONFIRM[command].body,
      color: command === RobotCommand.Reset ? "danger" : "primary",
      confirmText: RobotCommandLabel[command],
    });
    if (!ok) return;
    try {
      await commandResource.sendCommand(telemetry?.robotId ?? 0, command);
      onResult(
        true,
        `${robotName}: ${RobotCommandLabel[command]} 명령을 보냈습니다.`,
      );
    } catch (error) {
      onResult(false, (error as Error).message);
    }
  };

  runRef.current = run;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {order.map((command) => (
        <ControlButton
          key={command}
          command={command}
          enabled={available.has(command)}
          offline={telemetry?.online === false}
          busy={commandResource.loading}
          onRun={handleRun}
        />
      ))}
    </div>
  );
}
