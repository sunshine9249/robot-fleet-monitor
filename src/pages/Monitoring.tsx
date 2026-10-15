import { useEffect } from "react";
import {
  Page,
  PagePath,
  Section,
  registerPage,
  RobotListResource,
  SiteMapResource,
  MissionListResource,
  RobotCommandResource,
  AIChatAskResource,
} from "core";
import MonitoringView from "components/monitoring/MonitoringView";
import { MD_SYMBOLS_ICONS } from "../icons";

export const MonitoringPage = registerPage(
  {
    page: Page.Monitoring,
    title: PagePath[Page.Monitoring][0],
    icon: MD_SYMBOLS_ICONS.monitoring,
    path: PagePath[Page.Monitoring][1],
    section: Section.Monitoring,
    sortIndex: 0,
    resources: [RobotListResource, SiteMapResource] as const,
    optionalResources: [
      MissionListResource,
      RobotCommandResource,
      AIChatAskResource,
    ] as const,
  },
  (
    [robotListResource, siteMapResource],
    [missionListResource, commandResource, aiChatResource],
  ) => {
    const { setActive } = robotListResource;
    useEffect(() => {
      setActive(true);
      return () => setActive(false);
    }, [setActive]);

    return (
      <MonitoringView
        robotListResource={robotListResource}
        siteMapResource={siteMapResource}
        missionListResource={missionListResource}
        commandResource={commandResource}
        aiChatResource={aiChatResource}
      />
    );
  },
);
