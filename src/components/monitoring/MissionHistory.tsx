import { EuiBasicTable, EuiBasicTableColumn, EuiProgress } from "@elastic/eui";
import {
  Mission,
  MissionStatus,
  MissionStatusLabel,
  MissionTypeLabel,
  formatDateTime,
  formatDuration,
} from "core";

const STATUS_COLOR: Record<MissionStatus, string> = {
  [MissionStatus.InProgress]: "#00e5ff",
  [MissionStatus.Completed]: "#10b981",
  [MissionStatus.Failed]: "#f43f5e",
  [MissionStatus.Canceled]: "#94a3b8",
};

const columns: EuiBasicTableColumn<Mission>[] = [
  {
    field: "createdAt",
    name: "시작",
    width: "70px",
    render: (value: number) => formatDateTime(value, "HH:mm"),
  },
  {
    field: "type",
    name: "종류",
    width: "80px",
    render: (value: Mission["type"]) => MissionTypeLabel[value],
  },
  {
    field: "origin",
    name: "경로",
    render: (_value: string, mission: Mission) =>
      `${mission.origin} → ${mission.destination}`,
  },
  {
    field: "status",
    name: "결과",
    width: "120px",
    render: (value: MissionStatus, mission: Mission) =>
      value === MissionStatus.InProgress ? (
        <div style={{ width: "100%" }}>
          <span style={{ color: STATUS_COLOR[value], fontWeight: 600 }}>
            {Math.round(mission.progress * 100)}%
          </span>
          <EuiProgress
            value={mission.progress * 100}
            max={100}
            size="xs"
            color="primary"
          />
        </div>
      ) : (
        <span style={{ color: STATUS_COLOR[value], fontWeight: 600 }}>
          {MissionStatusLabel[value]}
        </span>
      ),
  },
  {
    field: "finishedAt",
    name: "소요",
    width: "70px",
    align: "right",
    render: (value: number | null, mission: Mission) =>
      value ? formatDuration((value - mission.createdAt) / 1000) : "-",
  },
];

export function MissionHistory({
  missions,
  loading,
}: {
  missions: Mission[];
  loading: boolean;
}) {
  return (
    <EuiBasicTable<Mission>
      items={missions.slice(0, 8)}
      columns={columns}
      loading={loading && missions.length === 0}
      compressed={true}
      tableLayout="auto"
      noItemsMessage="아직 수행한 임무가 없습니다."
    />
  );
}
