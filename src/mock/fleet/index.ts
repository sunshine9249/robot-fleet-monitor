import { db } from "../db";
import { SITE_MAP } from "../site";
import { FleetSimulator } from "./simulator";

let simulator: FleetSimulator | null = null;

/** 앱 전체에서 하나만 씁니다. 처음 부르는 순간 시뮬레이션을 시작합니다 */
export function getFleetSimulator(): FleetSimulator {
  if (!simulator) {
    simulator = new FleetSimulator(SITE_MAP, db.robots);
    simulator.start();
  }
  return simulator;
}

export { FleetSimulator };
