import { SiteMap, Waypoint, WaypointKind } from "core/types/robot";

export interface GraphEdge {
  to: string;
  cost: number;
  /** 엘리베이터로 층을 옮기는 연결이면 엘리베이터 id */
  elevatorId?: number;
}

/**
 * 경유점 그래프와 최단 경로.
 * 경유점이 백여 개뿐이라 우선순위 큐 없이 단순 다익스트라로 충분합니다.
 */
export class WaypointGraph {
  readonly nodes = new Map<string, Waypoint>();
  private readonly adjacency = new Map<string, GraphEdge[]>();

  constructor(site: SiteMap) {
    for (const waypoint of site.waypoints) {
      this.nodes.set(waypoint.id, waypoint);
      this.adjacency.set(waypoint.id, []);
    }

    for (const [from, to] of site.edges) {
      const fromNode = this.nodes.get(from);
      const toNode = this.nodes.get(to);
      if (!fromNode || !toNode) continue;
      const cost = Math.hypot(fromNode.x - toNode.x, fromNode.z - toNode.z);
      this.adjacency.get(from)?.push({ to, cost });
      this.adjacency.get(to)?.push({ to: from, cost });
    }

    const levelOf = new Map(
      site.floors.map((floor) => [floor.id, floor.level]),
    );
    for (const elevator of site.elevators) {
      const stops = site.waypoints.filter(
        (waypoint) =>
          waypoint.kind === WaypointKind.Elevator &&
          waypoint.id.endsWith(`-E${elevator.id}`),
      );
      for (const from of stops) {
        for (const to of stops) {
          if (from.id === to.id) continue;
          const levels = Math.abs(
            (levelOf.get(from.floorId) ?? 0) - (levelOf.get(to.floorId) ?? 0),
          );
          // 엘리베이터는 기다리는 시간이 커서 같은 층 이동보다 훨씬 비싸게 칩니다
          this.adjacency.get(from.id)?.push({
            to: to.id,
            cost: 20 + levels * 4,
            elevatorId: elevator.id,
          });
        }
      }
    }
  }

  edge(from: string, to: string): GraphEdge | undefined {
    return this.adjacency.get(from)?.find((edge) => edge.to === to);
  }

  /** from 을 빼고 to 까지의 경유점 id 목록. 갈 수 없으면 null */
  shortestPath(from: string, to: string): string[] | null {
    if (from === to) return [];
    const distance = new Map<string, number>([[from, 0]]);
    const previous = new Map<string, string>();
    const visited = new Set<string>();

    for (;;) {
      let current: string | null = null;
      let best = Infinity;
      for (const [node, value] of distance) {
        if (!visited.has(node) && value < best) {
          best = value;
          current = node;
        }
      }
      if (current === null) return null;
      if (current === to) break;
      visited.add(current);

      for (const edge of this.adjacency.get(current) ?? []) {
        const next = best + edge.cost;
        if (next < (distance.get(edge.to) ?? Infinity)) {
          distance.set(edge.to, next);
          previous.set(edge.to, current);
        }
      }
    }

    const path: string[] = [];
    let node: string | undefined = to;
    while (node && node !== from) {
      path.unshift(node);
      node = previous.get(node);
    }
    return path;
  }

  /** 좌표에서 가장 가까운 같은 층 경유점 */
  nearest(floorId: number, x: number, z: number): Waypoint {
    let best: Waypoint | null = null;
    let bestDistance = Infinity;
    for (const node of this.nodes.values()) {
      if (node.floorId !== floorId) continue;
      const value = Math.hypot(node.x - x, node.z - z);
      if (value < bestDistance) {
        best = node;
        bestDistance = value;
      }
    }
    if (!best) throw new Error(`No waypoint on floor ${floorId}`);
    return best;
  }

  byKind(kind: WaypointKind, floorId?: number): Waypoint[] {
    return [...this.nodes.values()].filter(
      (node) =>
        node.kind === kind &&
        (floorId === undefined || node.floorId === floorId),
    );
  }
}
