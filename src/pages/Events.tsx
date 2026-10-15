import {
  Page,
  PagePath,
  Section,
  registerPage,
  EventListResource,
  EventViewResource,
  EventUpdateResource,
  RobotListResource,
  SiteMapResource,
} from "core";
import EventsView from "components/events/EventsView";
import { MD_SYMBOLS_ICONS } from "../icons";

const basePath = PagePath[Page.Events][1];

export const EventsPage = registerPage(
  {
    page: Page.Events,
    title: PagePath[Page.Events][0],
    icon: MD_SYMBOLS_ICONS.notifications,
    path: basePath,
    section: Section.Events,
    sortIndex: 0,
    resources: [EventListResource, EventViewResource, SiteMapResource] as const,
    optionalResources: [EventUpdateResource, RobotListResource] as const,
  },
  (
    [eventListResource, eventViewResource, siteMapResource],
    [eventUpdateResource, robotListResource],
  ) => (
    <EventsView
      basePath={basePath}
      eventListResource={eventListResource}
      eventViewResource={eventViewResource}
      eventUpdateResource={eventUpdateResource}
      robotListResource={robotListResource}
      siteMapResource={siteMapResource}
    />
  ),
);
