import { useEffect } from "react";
import {
  Page,
  PagePath,
  Section,
  registerPage,
  RobotListResource,
  SiteMapResource,
  DashboardSummaryResource,
  MissionListResource,
} from "core";
import DashboardView from "components/dashboard/DashboardView";
import { MD_SYMBOLS_ICONS } from "../icons";

export const DashboardPage = registerPage(
  {
    page: Page.Dashboard,
    title: PagePath[Page.Dashboard][0],
    icon: MD_SYMBOLS_ICONS.spaceDashboard,
    path: PagePath[Page.Dashboard][1],
    section: Section.Dashboard,
    sortIndex: 0,
    resources: [RobotListResource, SiteMapResource] as const,
    optionalResources: [DashboardSummaryResource, MissionListResource] as const,
  },
  (
    [robotListResource, siteMapResource],
    [summaryResource, missionListResource],
  ) => {
    const { setActive } = robotListResource;

    useEffect(() => {
      setActive(true);
      return () => setActive(false);
    }, [setActive]);

    return (
      <DashboardView
        robotListResource={robotListResource}
        siteMapResource={siteMapResource}
        summaryResource={summaryResource}
        missionListResource={missionListResource}
      />
    );
  },
);
