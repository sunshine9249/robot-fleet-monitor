import {
  Page,
  PagePath,
  Section,
  registerPage,
  RobotListResource,
  RobotViewResource,
  RobotAddResource,
  RobotEditResource,
  RobotDeleteResource,
  SiteMapResource,
} from "core";
import RobotsView from "components/robots/RobotsView";
import { MD_SYMBOLS_ICONS } from "../icons";

const basePath = PagePath[Page.Robots][1];

export const RobotsPage = registerPage(
  {
    page: Page.Robots,
    title: PagePath[Page.Robots][0],
    icon: MD_SYMBOLS_ICONS.robot,
    path: basePath,
    section: Section.Basic,
    sortIndex: 0,
    resources: [RobotListResource, RobotViewResource, SiteMapResource] as const,
    optionalResources: [
      RobotAddResource,
      RobotEditResource,
      RobotDeleteResource,
    ] as const,
    resourceDependency: [[RobotAddResource, RobotEditResource]],
  },
  (
    [robotListResource, robotViewResource, siteMapResource],
    [robotAddResource, robotEditResource, robotDeleteResource],
  ) => (
    <RobotsView
      basePath={basePath}
      robotListResource={robotListResource}
      robotViewResource={robotViewResource}
      siteMapResource={siteMapResource}
      robotAddResource={robotAddResource}
      robotEditResource={robotEditResource}
      robotDeleteResource={robotDeleteResource}
    />
  ),
);
