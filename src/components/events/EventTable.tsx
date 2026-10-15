import { useHistory } from "react-router-dom";
import {
  Criteria,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiHighlight,
} from "@elastic/eui";
import {
  EventListResource,
  EventTypeLabel,
  RobotEvent,
  SiteFloor,
  formatDateTime,
  isSafeToOnClickRow,
} from "core";
import { EventStatusBadge, SeverityBadge } from "components/common/robot";

interface EventTableProps {
  basePath: string;
  eventListResource: EventListResource;
  floors: SiteFloor[];
}

export function EventTable({
  basePath,
  eventListResource,
  floors,
}: EventTableProps) {
  const history = useHistory();
  const query = eventListResource.filter.query;
  const floorName = (floorId: number) =>
    floors.find((floor) => floor.id === floorId)?.name ?? "-";

  const columns: EuiBasicTableColumn<RobotEvent>[] = [
    {
      field: "occurredAt",
      name: "발생 시각",
      sortable: true,
      width: "150px",
      render: (value: number) => formatDateTime(value, "MM-DD HH:mm:ss"),
    },
    {
      field: "severity",
      name: "심각도",
      sortable: true,
      width: "80px",
      render: (value: RobotEvent["severity"]) => (
        <SeverityBadge severity={value} />
      ),
    },
    {
      field: "type",
      name: "유형",
      sortable: true,
      width: "150px",
      render: (value: RobotEvent["type"]) => (
        <strong>{EventTypeLabel[value]}</strong>
      ),
    },
    {
      field: "robotName",
      name: "로봇",
      sortable: true,
      width: "90px",
      render: (value: string) => (
        <EuiHighlight search={query}>{value}</EuiHighlight>
      ),
    },
    {
      field: "floorId",
      name: "층",
      width: "56px",
      render: (value: number) => floorName(value),
    },
    {
      field: "message",
      name: "내용",
      truncateText: true,
      render: (value: string, event: RobotEvent) => (
        <span title={event.note ? `조치: ${event.note}` : value}>
          <EuiHighlight search={query}>{value}</EuiHighlight>
        </span>
      ),
    },
    {
      field: "status",
      name: "처리",
      sortable: true,
      width: "100px",
      render: (value: RobotEvent["status"]) => (
        <EventStatusBadge status={value} />
      ),
    },
  ];

  return (
    <EuiBasicTable<RobotEvent>
      items={eventListResource.items}
      itemId="id"
      columns={columns}
      loading={eventListResource.loading}
      sorting={{
        sort: {
          field: eventListResource.sort,
          direction: eventListResource.order,
        },
      }}
      onChange={({ page, sort }: Criteria<RobotEvent>) => {
        if (sort) {
          eventListResource.setSort(sort.field);
          eventListResource.setOrder(sort.direction);
        }
        if (page) {
          eventListResource.setPage(page.index + 1);
          eventListResource.setPageSize(page.size);
        }
      }}
      pagination={{
        pageIndex: eventListResource.page - 1,
        pageSize: eventListResource.pageSize,
        totalItemCount: eventListResource.count,
        pageSizeOptions: [20, 50, 100],
      }}
      noItemsMessage="조건에 맞는 이벤트가 없습니다."
      rowProps={(event) => ({
        onClick: (mouseEvent: React.MouseEvent) => {
          if (isSafeToOnClickRow(mouseEvent)) {
            history.push(`${basePath}/${event.id}${history.location.search}`);
          }
        },
        style: { cursor: "pointer" },
      })}
      tableLayout="fixed"
    />
  );
}
