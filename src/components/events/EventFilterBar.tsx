import { useEffect, useState } from "react";
import {
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import {
  EMPTY_EVENT_FILTER,
  EventListFilter,
  EventSeverity,
  EventSeverityLabel,
  EventStatus,
  EventStatusLabel,
  EventType,
  EventTypeLabel,
  RobotListItem,
  useDebounce,
} from "core";
import SearchFilter from "components/common/SearchFilter";

type RangeKey = "today" | "7d" | "30d" | "all";

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "7d", label: "7일" },
  { id: "30d", label: "30일" },
  { id: "all", label: "전체" },
];

export function rangeOf(key: RangeKey): [number, number] | null {
  const now = Date.now();
  if (key === "all") return null;
  if (key === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return [start.getTime(), now + 60 * 60 * 1000];
  }
  const days = key === "7d" ? 7 : 30;
  return [now - days * 24 * 3600 * 1000, now + 60 * 60 * 1000];
}

function options<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({
    label: labels[value],
    value,
  }));
}

interface EventFilterBarProps {
  filter: EventListFilter;
  onChange: (filter: EventListFilter) => void;
  robots: RobotListItem[];
  rangeKey: RangeKey;
  onRangeKeyChange: (key: RangeKey) => void;
}

export type { RangeKey };

export function EventFilterBar({
  filter,
  onChange,
  robots,
  rangeKey,
  onRangeKeyChange,
}: EventFilterBarProps) {
  const [query, setQuery] = useState(filter.query);
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    if (debounced !== filter.query) onChange({ ...filter, query: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const robotOptions = robots.map((robot) => ({
    label: robot.name,
    value: robot.id,
  }));
  const isEmpty =
    !filter.query &&
    filter.robotId === null &&
    filter.types.length === 0 &&
    filter.severities.length === 0 &&
    filter.statuses.length === 0 &&
    rangeKey === "7d";

  return (
    <EuiFlexGroup
      gutterSize="s"
      wrap={true}
      alignItems="center"
      responsive={false}
    >
      <EuiFlexItem grow={2} style={{ minWidth: 200 }}>
        <SearchFilter
          label="로봇·내용·조치 내용 검색"
          query={query}
          setQuery={setQuery}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonGroup
          legend="기간"
          options={RANGE_OPTIONS}
          idSelected={rangeKey}
          onChange={(id) => onRangeKeyChange(id as RangeKey)}
          buttonSize="compressed"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1} style={{ minWidth: 140 }}>
        <EuiComboBox
          aria-label="로봇"
          placeholder="로봇 전체"
          singleSelection={{ asPlainText: true }}
          compressed={true}
          options={robotOptions}
          selectedOptions={robotOptions.filter(
            (option) => option.value === filter.robotId,
          )}
          onChange={(selected) =>
            onChange({ ...filter, robotId: selected[0]?.value ?? null })
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={2} style={{ minWidth: 180 }}>
        <EuiComboBox
          aria-label="유형"
          placeholder="유형 전체"
          compressed={true}
          options={options<EventType>(EventTypeLabel)}
          selectedOptions={options<EventType>(EventTypeLabel).filter((option) =>
            filter.types.includes(option.value),
          )}
          onChange={(selected) =>
            onChange({
              ...filter,
              types: selected.map((option) => option.value as EventType),
            })
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1} style={{ minWidth: 140 }}>
        <EuiComboBox
          aria-label="심각도"
          placeholder="심각도 전체"
          compressed={true}
          options={options<EventSeverity>(EventSeverityLabel)}
          selectedOptions={options<EventSeverity>(EventSeverityLabel).filter(
            (option) => filter.severities.includes(option.value),
          )}
          onChange={(selected) =>
            onChange({
              ...filter,
              severities: selected.map(
                (option) => option.value as EventSeverity,
              ),
            })
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1} style={{ minWidth: 150 }}>
        <EuiComboBox
          aria-label="처리 상태"
          placeholder="처리 상태 전체"
          compressed={true}
          options={options<EventStatus>(EventStatusLabel)}
          selectedOptions={options<EventStatus>(EventStatusLabel).filter(
            (option) => filter.statuses.includes(option.value),
          )}
          onChange={(selected) =>
            onChange({
              ...filter,
              statuses: selected.map((option) => option.value as EventStatus),
            })
          }
        />
      </EuiFlexItem>
      {!isEmpty && (
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="s"
            onClick={() => {
              setQuery("");
              onRangeKeyChange("7d");
              onChange({ ...EMPTY_EVENT_FILTER, range: rangeOf("7d") });
            }}
          >
            필터 초기화
          </EuiButtonEmpty>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}
