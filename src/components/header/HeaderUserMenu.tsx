import { useState, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { LINE_MD_ICONS } from "../../icons/lineMd";

import {
  EuiText,
  EuiLink,
  EuiSpacer,
  EuiPopover,
  EuiAvatar,
  EuiFlexItem,
  EuiFlexGroup,
  EuiHeaderSectionItemButton,
} from "@elastic/eui";

import { EuiCustomLink, PagePath, UserContext } from "core";
import styles from "./HeaderUserMenu.module.scss";
import classNames from "classnames";

export function HeaderUserMenu() {
  const history = useHistory();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user, logout } = useContext(UserContext);

  const button = (
    <EuiHeaderSectionItemButton
      aria-controls="headerUserMenu"
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label="내 계정"
      onClick={() => setIsOpen(!isOpen)}
      size="m"
      title="내 계정"
      className={classNames(styles.userMenuButton, {
        [styles.focused]: isOpen,
      })}
    >
      <Icon icon={LINE_MD_ICONS.user} width={24} height={24} color="#94a3b8" />
    </EuiHeaderSectionItemButton>
  );

  return (
    <EuiPopover
      id="headerUserMenu"
      panelClassName={styles.panel}
      button={button}
      isOpen={isOpen}
      anchorPosition="downRight"
      closePopover={() => setIsOpen(false)}
      repositionOnScroll={true}
    >
      <EuiFlexGroup gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiAvatar name={user?.name ?? ""} size="m" initialsLength={1} />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiText size="s">
            <strong>{user?.name}</strong>
          </EuiText>
          <EuiText size="xs" color="subdued">
            {user?.username} · {user?.role.name}
          </EuiText>

          <EuiSpacer size="m" />

          <EuiFlexGroup
            justifyContent="spaceBetween"
            alignItems="center"
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiCustomLink
                as="button"
                onClick={() => {
                  setIsOpen(false);
                  if (location.pathname === PagePath.PersonalPage[1]) return;
                  history.push(PagePath.PersonalPage[1], {
                    returnTo:
                      location.pathname + location.search + location.hash,
                  });
                }}
              >
                계정 설정
              </EuiCustomLink>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiLink onClick={logout}>로그아웃</EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPopover>
  );
}
