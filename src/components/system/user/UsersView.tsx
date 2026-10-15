import { useCallback, useContext, useEffect, useState } from "react";
import { Route, Switch, useHistory } from "react-router-dom";
import {
  Criteria,
  EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiSelect,
  EuiSpacer,
} from "@elastic/eui";
import {
  RoleListResource,
  ToastContext,
  UserAddResource,
  UserContext,
  UserDeleteResource,
  UserEditResource,
  UserListResource,
  UserListItem,
  UserViewResource,
  formatRelative,
  useConfirm,
  useDebounce,
} from "core";
import { PageShell } from "components/common/PageShell";
import SearchFilter from "components/common/SearchFilter";
import { UserFormFlyout } from "./UserFormFlyout";

interface UsersViewProps {
  basePath: string;
  userListResource: UserListResource;
  userViewResource: UserViewResource;
  roleListResource: RoleListResource | null;
  userAddResource: UserAddResource | null;
  userEditResource: UserEditResource | null;
  userDeleteResource: UserDeleteResource | null;
}

export default function UsersView({
  basePath,
  userListResource,
  userViewResource,
  roleListResource,
  userAddResource,
  userEditResource,
  userDeleteResource,
}: UsersViewProps) {
  const history = useHistory();
  const confirm = useConfirm();
  const { addToast } = useContext(ToastContext);
  const { user: me } = useContext(UserContext);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const roles = roleListResource?.items ?? [];

  const { setQuery: setListQuery, setActive } = userListResource;
  useEffect(() => setListQuery(debounced), [debounced, setListQuery]);
  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);
  const setRolesActive = roleListResource?.setActive;
  useEffect(() => {
    setRolesActive?.(true);
  }, [setRolesActive]);

  const handleDelete = useCallback(
    async (user: UserListItem) => {
      if (!userDeleteResource) return;
      const ok = await confirm({
        title: "사용자 삭제",
        body: `${user.name}(${user.username}) 님을 삭제할까요? 더 이상 로그인할 수 없습니다.`,
        confirmText: "삭제",
      });
      if (!ok) return;
      try {
        await userDeleteResource.deleteUsers([user.id]);
        addToast("success", { title: `${user.name} 님을 삭제했습니다.` });
        userListResource.reload();
      } catch (error) {
        addToast("error", {
          title: "삭제하지 못했습니다.",
          error: (error as Error).message,
        });
      }
    },
    [userDeleteResource, confirm, addToast, userListResource],
  );

  const columns: EuiBasicTableColumn<UserListItem>[] = [
    {
      field: "name",
      name: "이름",
      sortable: true,
      render: (value: string, user: UserListItem) => (
        <span>
          <strong>
            <EuiHighlight search={debounced}>{value}</EuiHighlight>
          </strong>
          {user.id === me?.id && (
            <EuiBadge color="hollow" style={{ marginLeft: 6 }}>
              나
            </EuiBadge>
          )}
        </span>
      ),
    },
    {
      field: "username",
      name: "아이디",
      sortable: true,
      render: (value: string) => (
        <EuiHighlight search={debounced}>{value}</EuiHighlight>
      ),
    },
    {
      field: "role",
      name: "권한",
      render: (role: UserListItem["role"]) => (
        <EuiBadge color="primary">{role.name}</EuiBadge>
      ),
    },
    {
      field: "jobPosition",
      name: "직책",
      render: (value: string | null) => value ?? "-",
    },
    {
      field: "email",
      name: "이메일",
      render: (value: string | null) =>
        value ? <EuiHighlight search={debounced}>{value}</EuiHighlight> : "-",
    },
    {
      field: "contact",
      name: "연락처",
      render: (value: string | null) => value ?? "-",
    },
    {
      field: "lastLoginAt",
      name: "최근 로그인",
      sortable: true,
      render: (value: number | null) =>
        value ? formatRelative(value) : "기록 없음",
    },
    {
      name: "",
      width: "80px",
      actions: [
        {
          name: "수정",
          description: "정보 수정",
          icon: "pencil",
          type: "icon",
          available: () => Boolean(userEditResource),
          onClick: (user: UserListItem) =>
            history.push(`${basePath}/${user.id}/edit`),
        },
        {
          name: "삭제",
          description: "사용자 삭제",
          icon: "trash",
          type: "icon",
          color: "danger",
          available: (user: UserListItem) =>
            Boolean(userDeleteResource) && user.id !== me?.id,
          onClick: handleDelete,
        },
      ],
    },
  ];

  return (
    <PageShell
      title="사용자 관리"
      description="관제 시스템에 로그인할 수 있는 사람과 권한을 관리합니다."
      actions={
        userAddResource && (
          <EuiButton
            fill={true}
            iconType="plusInCircle"
            onClick={() => history.push(`${basePath}/add`)}
          >
            사용자 등록
          </EuiButton>
        )
      }
    >
      <EuiFlexGroup gutterSize="s" responsive={false}>
        <EuiFlexItem grow={3}>
          <SearchFilter
            label="이름·아이디·이메일 검색"
            query={query}
            setQuery={setQuery}
          />
        </EuiFlexItem>
        {roles.length > 0 && (
          <EuiFlexItem grow={1}>
            <EuiSelect
              compressed={true}
              aria-label="권한"
              options={[
                { value: "", text: "권한 전체" },
                ...roles.map((role) => ({
                  value: String(role.id),
                  text: role.name,
                })),
              ]}
              value={
                userListResource.roleId === null
                  ? ""
                  : String(userListResource.roleId)
              }
              onChange={(event) =>
                userListResource.setRoleId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiBasicTable<UserListItem>
        items={userListResource.items}
        itemId="id"
        columns={columns}
        loading={userListResource.loading}
        sorting={{
          sort: {
            field: userListResource.sort,
            direction: userListResource.order,
          },
        }}
        onChange={({ sort, page }: Criteria<UserListItem>) => {
          if (sort) {
            userListResource.setSort(sort.field);
            userListResource.setOrder(sort.direction);
          }
          if (page) {
            userListResource.setPage(page.index + 1);
            userListResource.setPageSize(page.size);
          }
        }}
        pagination={{
          pageIndex: userListResource.page - 1,
          pageSize: userListResource.pageSize,
          totalItemCount: userListResource.count,
          pageSizeOptions: [20, 50],
        }}
        noItemsMessage="조건에 맞는 사용자가 없습니다."
        tableLayout="auto"
      />
      <Switch>
        <Route path={`${basePath}/add`}>
          {userAddResource && (
            <UserFormFlyout
              basePath={basePath}
              mode="add"
              roles={roles}
              userListResource={userListResource}
              userViewResource={userViewResource}
              userAddResource={userAddResource}
              userEditResource={userEditResource}
            />
          )}
        </Route>
        <Route path={`${basePath}/:userId/edit`}>
          {userEditResource && (
            <UserFormFlyout
              basePath={basePath}
              mode="edit"
              roles={roles}
              userListResource={userListResource}
              userViewResource={userViewResource}
              userAddResource={userAddResource}
              userEditResource={userEditResource}
            />
          )}
        </Route>
      </Switch>
    </PageShell>
  );
}
