import {
  SiteMap,
  SiteFloor,
  SiteDock,
  SiteZone,
  SiteElevator,
  Waypoint,
  WaypointKind,
} from "core/types/robot";

/**
 * 데모용 가상 시설 "한빛 스퀘어" — 지하 1층 물류, 1층 로비, 2층 오피스.
 *
 * 좌표 단위는 m 입니다. 각 층은 가로(x) 64m × 세로(z) 24m 이고,
 * 가운데(z=0)에 동서로 긴 복도가 있습니다. 북쪽(z<0)과 남쪽(z>0)에 방이 붙고,
 * 엘리베이터 두 대는 복도 북쪽 가운데에, 충전 스테이션은 서쪽 끝 남쪽에 있습니다.
 */

const FLOOR_WIDTH = 64;
const FLOOR_DEPTH = 24;
const CORRIDOR_X = [-28, -20, -12, -4, 4, 12, 20, 28];
const POI_Z = 4.5;
const ZONE_DEPTH = 6.5;
const ZONE_WIDTH = 6.4;

type RoomSpec = { name: string; x: number; side: "north" | "south" };

const FLOORS: (SiteFloor & { rooms: RoomSpec[]; docks: number[] })[] = [
  {
    id: 1,
    name: "B1",
    label: "물류·하역",
    level: 0,
    width: FLOOR_WIDTH,
    depth: FLOOR_DEPTH,
    docks: [-28, -20],
    rooms: [
      { name: "하역장", x: -28, side: "north" },
      { name: "물품 보관실", x: -20, side: "north" },
      { name: "폐기물 집하장", x: -12, side: "north" },
      { name: "주방 창고", x: 12, side: "north" },
      { name: "기계실", x: 20, side: "north" },
      { name: "직원 출입구", x: 28, side: "north" },
      { name: "검수 데스크", x: -12, side: "south" },
      { name: "냉장 보관실", x: 12, side: "south" },
      { name: "택배 보관함", x: 20, side: "south" },
      { name: "주차장 연결통로", x: 28, side: "south" },
    ],
  },
  {
    id: 2,
    name: "1F",
    label: "로비",
    level: 1,
    width: FLOOR_WIDTH,
    depth: FLOOR_DEPTH,
    docks: [-28, -20, -12, -4],
    rooms: [
      { name: "정문", x: -28, side: "north" },
      { name: "안내 데스크", x: -20, side: "north" },
      { name: "카페", x: -12, side: "north" },
      { name: "전시관", x: 12, side: "north" },
      { name: "세미나실", x: 20, side: "north" },
      { name: "후문", x: 28, side: "north" },
      { name: "편의점", x: 12, side: "south" },
      { name: "라운지", x: 20, side: "south" },
      { name: "보안실", x: 28, side: "south" },
    ],
  },
  {
    id: 3,
    name: "2F",
    label: "오피스",
    level: 2,
    width: FLOOR_WIDTH,
    depth: FLOOR_DEPTH,
    docks: [-28, -20],
    rooms: [
      { name: "회의실 A", x: -28, side: "north" },
      { name: "회의실 B", x: -20, side: "north" },
      { name: "탕비실", x: -12, side: "north" },
      { name: "개발팀", x: 12, side: "north" },
      { name: "디자인팀", x: 20, side: "north" },
      { name: "대표실", x: 28, side: "north" },
      { name: "인사팀", x: -12, side: "south" },
      { name: "운영팀", x: 12, side: "south" },
      { name: "서버실", x: 20, side: "south" },
      { name: "휴게실", x: 28, side: "south" },
    ],
  },
];

const ELEVATOR_X = [-4, 4];

function corridorId(floorId: number, x: number) {
  return `F${floorId}-C${x}`;
}

function buildSiteMap(): SiteMap {
  const waypoints: Waypoint[] = [];
  const edges: [string, string][] = [];
  const zones: SiteZone[] = [];
  const docks: SiteDock[] = [];
  const elevators: SiteElevator[] = ELEVATOR_X.map((x, idx) => ({
    id: idx + 1,
    name: `EV-${idx + 1}`,
    x,
    z: -9,
    floorIds: FLOORS.map((floor) => floor.id),
  }));

  let dockId = 1;

  for (const floor of FLOORS) {
    // 복도
    CORRIDOR_X.forEach((x, idx) => {
      waypoints.push({
        id: corridorId(floor.id, x),
        name: `${floor.name} 복도 ${idx + 1}`,
        floorId: floor.id,
        x,
        z: 0,
        kind: WaypointKind.Path,
      });
      if (idx > 0) {
        edges.push([
          corridorId(floor.id, CORRIDOR_X[idx - 1]),
          corridorId(floor.id, x),
        ]);
      }
    });

    // 방 (목적지)
    for (const room of floor.rooms) {
      const sign = room.side === "north" ? -1 : 1;
      const id = `F${floor.id}-P${room.x}${room.side[0].toUpperCase()}`;
      waypoints.push({
        id,
        name: room.name,
        floorId: floor.id,
        x: room.x,
        z: sign * POI_Z,
        kind: WaypointKind.Poi,
      });
      edges.push([corridorId(floor.id, room.x), id]);
      zones.push({
        id,
        name: room.name,
        floorId: floor.id,
        x: room.x,
        z: sign * (POI_Z + ZONE_DEPTH / 2 + 0.6),
        width: ZONE_WIDTH,
        depth: ZONE_DEPTH,
      });
    }

    // 엘리베이터 탑승 지점
    elevators.forEach((elevator) => {
      const id = `F${floor.id}-E${elevator.id}`;
      waypoints.push({
        id,
        name: `${floor.name} ${elevator.name} 앞`,
        floorId: floor.id,
        x: elevator.x,
        z: -6,
        kind: WaypointKind.Elevator,
      });
      edges.push([corridorId(floor.id, elevator.x), id]);
    });

    // 충전 스테이션
    for (const x of floor.docks) {
      const waypointId = `F${floor.id}-D${x}`;
      waypoints.push({
        id: waypointId,
        name: `${floor.name} 충전 스테이션 ${dockId}`,
        floorId: floor.id,
        x,
        z: 5,
        kind: WaypointKind.Dock,
      });
      edges.push([corridorId(floor.id, x), waypointId]);
      docks.push({
        id: dockId,
        name: `CS-${String(dockId).padStart(2, "0")}`,
        floorId: floor.id,
        x,
        z: 6.6,
        waypointId,
      });
      dockId += 1;
    }
  }

  return {
    id: 1,
    name: "한빛 스퀘어",
    address: "데모용 가상 시설",
    floors: FLOORS.map(({ rooms, docks, ...floor }) => floor),
    elevators,
    docks,
    zones,
    waypoints,
    edges,
  };
}

export const SITE_MAP: SiteMap = buildSiteMap();

/** 엘리베이터 탑승 지점 id */
export function elevatorWaypointId(floorId: number, elevatorId: number) {
  return `F${floorId}-E${elevatorId}`;
}
