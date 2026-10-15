import { describe, expect, it } from "vitest";
import { SITE_MAP } from "../site";
import { WaypointGraph } from "./graph";

describe("WaypointGraph", () => {
  const graph = new WaypointGraph(SITE_MAP);

  it("같은 층 안에서는 복도를 따라 갑니다", () => {
    const path = graph.shortestPath("F2-C-28", "F2-C28");
    expect(path).not.toBeNull();
    expect(path?.every((id) => id.startsWith("F2-"))).toBe(true);
    expect(path?.at(-1)).toBe("F2-C28");
  });

  it("다른 층으로 갈 때는 엘리베이터를 지납니다", () => {
    const path = graph.shortestPath("F1-D-28", "F3-P28N");
    expect(path).not.toBeNull();
    const elevatorStops = path?.filter((id) => /-E\d$/.test(id)) ?? [];
    expect(elevatorStops.length).toBeGreaterThanOrEqual(2);
    expect(path?.at(-1)).toBe("F3-P28N");
  });

  it("출발지와 목적지가 같으면 빈 경로입니다", () => {
    expect(graph.shortestPath("F1-C4", "F1-C4")).toEqual([]);
  });
});
