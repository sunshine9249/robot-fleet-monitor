import { useCallback, useContext, useEffect, useState } from "react";
import { Route, Switch, useHistory } from "react-router-dom";
import {
  Criteria,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiSelect,
  EuiSpacer,
} from "@elastic/eui";
import {
  RobotAddResource,
  RobotDeleteResource,
  RobotEditResource,
  RobotHealth,
  RobotHealthLabel,
  RobotListResource,
  RobotListItem,
  RobotType,
  RobotTypeLabel,
  RobotViewResource,
  SiteMapResource,
  ToastContext,
  isSafeToOnClickRow,
  useConfirm,
  useDebounce,
} from "core";
import { PageShell } from "components/common/PageShell";
import SearchFilter from "components/common/SearchFilter";
import {
  BatteryMeter,
  HealthBadge,
  RobotTypeText,
  useFleetView,
} from "components/common/robot";
import { RobotFormFlyout } from "./RobotFormFlyout";
import { RobotViewFlyout } from "./RobotViewFlyout";

interface RobotsViewProps {
  basePath: string;
  robotListResource: RobotListResource;
  robotViewResource: RobotViewResource;
  siteMapResource: SiteMapResource;
  robotAddResource: RobotAddResource | null;
  robotEditResource: RobotEditResource | null;
  robotDeleteResource: RobotDeleteResource | null;
}

export default function RobotsView({
  basePath,
  robotListResource,
  robotViewResource,
  siteMapResource,
  robotAddResource,
  robotEditResource,
  robotDeleteResource,
}: RobotsViewProps) {
  const history = useHistory();
  const confirm = useConfirm();
  const { addToast } = useContext(ToastContext);
  const site = siteMapResource.data;
  const [query, setQuery] = useState(robotListResource.query);
  const debounced = useDebounce(query, 300);
  const [selection, setSelection] = useState<RobotListItem[]>([]);
  const { views } = useFleetView(robotListResource.items, 2000);

  const { setQuery: setListQuery, setActive } = robotListResource;
  useEffect(() => setListQuery(debounced), [debounced, setListQuery]);
  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  const dockLabel = (dockId: number) => {
    const dock = site?.docks.find((item) => item.id === dockId);
    const floor = site?.floors.find((item) => item.id === dock?.floorId);
    return dock ? `${dock.name} · ${floor?.name ?? ""}` : "-";
  };

  const handleDelete = useCallback(
    async (ids: number[]) => {
      if (!robotDeleteResource) return;
      const names = robotListResource.items
        .filter((robot) => ids.includes(robot.id))
        .map((robot) => robot.name);
      const ok = await confirm({
        title: "로봇 삭제",
        body: `${names.join(", ")} 을(를) 삭제할까요? 삭제하면 관제 화면에서 사라지고 되돌릴 수 없습니다. 지난 이벤트 이력은 남습니다.`,
        confirmText: "삭제",
      });
      if (!ok) return;
      try {
        await robotDeleteResource.deleteRobots(ids);
        addToast("success", { title: `${names.length}대를 삭제했습니다.` });
        setSelection([]);
        robotListResource.reload();
        history.push(basePath);
      } catch (error) {
        addToast("error", {
          title: "삭제하지 못했습니다.",
          error: (error as Error).message,
        });
      }
    },
    [
      robotDeleteResource,
      robotListResource,
      confirm,
      addToast,
      history,
      basePath,
    ],
  );

  const columns: EuiBasicTableColumn<RobotListItem>[] = [
    {
      field: "name",
      name: "이름",
      sortable: true,
      render: (value: string, robot: RobotListItem) => (
        <strong style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <RobotTypeText type={robot.type} iconOnly={true} />
          <EuiHighlight search={debounced}>{value}</EuiHighlight>
        </strong>
      ),
    },
    {
      field: "type",
      name: "종류",
      sortable: true,
      render: (value: RobotType) => RobotTypeLabel[value],
    },
    {
      field: "model",
      name: "모델",
      render: (value: string, robot: RobotListItem) => (
        <EuiHighlight
          search={debounced}
        >{`${robot.manufacturer} ${value}`}</EuiHighlight>
      ),
    },
    {
      field: "serialNo",
      name: "시리얼",
      render: (value: string) => (
        <EuiHighlight search={debounced}>{value}</EuiHighlight>
      ),
    },
    {
      field: "dockId",
      name: "충전 스테이션",
      render: (value: number) => dockLabel(value),
    },
    {
      field: "overallStatus",
      name: "상태",
      sortable: true,
      render: (_value: RobotHealth, robot: RobotListItem) => {
        const view = views.find((item) => item.robot.id === robot.id);
        return (
          <HealthBadge health={view?.health ?? robot.overallStatus} size="s" />
        );
      },
    },
    {
      field: "battery",
      name: "배터리",
      render: (_value: number, robot: RobotListItem) => {
        const telemetry = views.find(
          (item) => item.robot.id === robot.id,
        )?.telemetry;
        return (
          <BatteryMeter
            battery={telemetry?.battery ?? robot.battery}
            charging={telemetry?.charging}
          />
        );
      },
    },
    {
      field: "todayMissionCount",
      name: "오늘 임무",
      align: "right",
      sortable: true,
      render: (value: number) => `${value}건`,
    },
    {
      field: "installedAt",
      name: "설치일",
      sortable: true,
    },
    {
      name: "",
      width: "80px",
      actions: [
        {
          name: "수정",
          description: "정보 수정",
          icon: "pencil",
          type: "icon",
          available: () => Boolean(robotEditResource),
          onClick: (robot: RobotListItem) =>
            history.push(`${basePath}/${robot.id}/edit`),
        },
        {
          name: "삭제",
          description: "로봇 삭제",
          icon: "trash",
          type: "icon",
          color: "danger",
          available: () => Boolean(robotDeleteResource),
          onClick: (robot: RobotListItem) => handleDelete([robot.id]),
        },
      ],
    },
  ];

  return (
    <PageShell
      title="로봇 관리"
      description="관제 대상 로봇을 등록하고 충전 스테이션을 지정합니다."
      actions={
        <>
          {robotDeleteResource && selection.length > 0 && (
            <EuiButton
              color="danger"
              iconType="trash"
              onClick={() => handleDelete(selection.map((robot) => robot.id))}
            >
              {selection.length}대 삭제
            </EuiButton>
          )}
          {robotAddResource && (
            <EuiButton
              fill={true}
              iconType="plusInCircle"
              onClick={() => history.push(`${basePath}/add`)}
            >
              로봇 등록
            </EuiButton>
          )}
        </>
      }
    >
      <EuiFlexGroup gutterSize="s" responsive={false} wrap={true}>
        <EuiFlexItem grow={3} style={{ minWidth: 220 }}>
          <SearchFilter
            label="이름·모델·시리얼 검색"
            query={query}
            setQuery={setQuery}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={1} style={{ minWidth: 140 }}>
          <EuiSelect
            compressed={true}
            aria-label="종류"
            options={[
              { value: "", text: "종류 전체" },
              ...Object.values(RobotType).map((type) => ({
                value: type,
                text: RobotTypeLabel[type],
              })),
            ]}
            value={robotListResource.type ?? ""}
            onChange={(event) =>
              robotListResource.setType(
                (event.target.value || null) as RobotType | null,
              )
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={1} style={{ minWidth: 140 }}>
          <EuiSelect
            compressed={true}
            aria-label="상태"
            options={[
              { value: "", text: "상태 전체" },
              ...Object.values(RobotHealth).map((health) => ({
                value: health,
                text: RobotHealthLabel[health],
              })),
            ]}
            value={robotListResource.status ?? ""}
            onChange={(event) =>
              robotListResource.setStatus(
                (event.target.value || null) as RobotHealth | null,
              )
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiBasicTable<RobotListItem>
        items={robotListResource.items}
        itemId="id"
        columns={columns}
        loading={robotListResource.loading}
        sorting={{
          sort: {
            field: robotListResource.sort,
            direction: robotListResource.order,
          },
        }}
        onChange={({ sort, page }: Criteria<RobotListItem>) => {
          if (sort) {
            robotListResource.setSort(sort.field);
            robotListResource.setOrder(sort.direction);
          }
          if (page) {
            robotListResource.setPage(page.index + 1);
            robotListResource.setPageSize(page.size);
          }
        }}
        pagination={{
          pageIndex: robotListResource.page - 1,
          pageSize: robotListResource.pageSize,
          totalItemCount: robotListResource.count,
          pageSizeOptions: [20, 50, 100],
        }}
        selection={
          robotDeleteResource ? { onSelectionChange: setSelection } : undefined
        }
        noItemsMessage="조건에 맞는 로봇이 없습니다."
        rowProps={(robot) => ({
          onClick: (event: React.MouseEvent) => {
            if (isSafeToOnClickRow(event))
              history.push(`${basePath}/${robot.id}`);
          },
          style: { cursor: "pointer" },
        })}
        tableLayout="auto"
      />

      <Switch>
        <Route path={`${basePath}/add`}>
          {robotAddResource && (
            <RobotFormFlyout
              basePath={basePath}
              mode="add"
              site={site}
              robotListResource={robotListResource}
              robotViewResource={robotViewResource}
              robotAddResource={robotAddResource}
              robotEditResource={robotEditResource}
            />
          )}
        </Route>
        <Route path={`${basePath}/:robotId/edit`}>
          {robotEditResource && (
            <RobotFormFlyout
              basePath={basePath}
              mode="edit"
              site={site}
              robotListResource={robotListResource}
              robotViewResource={robotViewResource}
              robotAddResource={robotAddResource}
              robotEditResource={robotEditResource}
            />
          )}
        </Route>
        <Route path={`${basePath}/:robotId`}>
          <RobotViewFlyout
            basePath={basePath}
            site={site}
            robotViewResource={robotViewResource}
            canEdit={Boolean(robotEditResource)}
            canDelete={Boolean(robotDeleteResource)}
            onDelete={(id) => handleDelete([id])}
          />
        </Route>
      </Switch>
    </PageShell>
  );
}
