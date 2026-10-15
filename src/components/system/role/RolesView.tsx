import { useContext, useEffect, useMemo, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiFieldText,
  EuiFormRow,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSwitch,
  EuiToolTip,
  htmlIdGenerator,
} from "@elastic/eui";
import {
  Resource,
  Page,
  Role,
  RoleAddResource,
  RoleDeleteResource,
  RoleEditResource,
  RoleFormData,
  RoleListResource,
  ToastContext,
  useConfirm,
} from "core";
import { PageShell } from "components/common/PageShell";
import {
  resourceLabel,
  buildPermissionModel,
  normalizeResources,
} from "./permissionModel";
import styles from "./RolesView.module.scss";

interface RolesViewProps {
  basePath: string;
  roleListResource: RoleListResource;
  roleAddResource: RoleAddResource | null;
  roleEditResource: RoleEditResource | null;
  roleDeleteResource: RoleDeleteResource | null;
}

const EMPTY_FORM: RoleFormData = {
  name: "",
  description: "",
  pages: [Page.Dashboard],
  resources: [],
};

const idPrefix = htmlIdGenerator("perm")();

export default function RolesView({
  basePath,
  roleListResource,
  roleAddResource,
  roleEditResource,
  roleDeleteResource,
}: RolesViewProps) {
  const history = useHistory();
  const confirm = useConfirm();
  const { addToast } = useContext(ToastContext);
  const match = useRouteMatch<{ roleId: string }>(`${basePath}/:roleId`);
  const routeId = match?.params.roleId;
  const creating = routeId === "add";
  const model = useMemo(() => buildPermissionModel(), []);
  const { items: roles, loading, setActive, reload } = roleListResource;

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  const selected: Role | null = creating
    ? null
    : (roles.find((role) => role.id === Number(routeId)) ?? roles[0] ?? null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);

  useEffect(() => {
    if (creating) {
      setForm(EMPTY_FORM);
      setEditing(true);
    } else if (selected) {
      setForm({
        name: selected.name,
        description: selected.description ?? "",
        pages: selected.pages,
        resources: selected.resources,
      });
      setEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    creating,
    selected?.id,
    selected?.pages.length,
    selected?.resources.length,
    selected?.name,
  ]);

  const locked = Boolean(selected?.isSystem);
  const canEdit = creating
    ? Boolean(roleAddResource)
    : Boolean(roleEditResource);
  const view = editing ? form : (selected ?? form);
  const enabledPages = view.pages;
  const requiredByEnabled = useMemo(() => {
    const set = new Set<Resource>();
    model.pages
      .filter((page) => enabledPages.includes(page.page))
      .forEach((page) =>
        page.required.forEach((resource) => set.add(resource)),
      );
    return set;
  }, [model, enabledPages]);

  const togglePage = (page: Page, on: boolean) =>
    setForm((previous) => ({
      ...previous,
      pages: on
        ? [...previous.pages, page]
        : previous.pages.filter((item) => item !== page),
    }));

  const toggleResource = (resource: Resource, on: boolean) =>
    setForm((previous) => ({
      ...previous,
      resources: on
        ? [...previous.resources, resource]
        : previous.resources.filter((item) => item !== resource),
    }));

  const save = async () => {
    const payload: RoleFormData = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      pages: form.pages,
      resources: normalizeResources(form.pages, form.resources, model),
    };
    if (!payload.name) {
      addToast("warning", { title: "권한 이름을 입력해 주세요." });
      return;
    }
    try {
      if (creating && roleAddResource) {
        const created = await roleAddResource.addRole(payload);
        addToast("success", { title: `${created.name} 권한을 만들었습니다.` });
        await reload();
        history.push(`${basePath}/${created.id}`);
      } else if (selected && roleEditResource) {
        await roleEditResource.editRole(selected.id, payload);
        addToast("success", {
          title: `${payload.name} 권한을 저장했습니다. 해당 사용자는 다시 로그인하면 반영됩니다.`,
        });
        await reload();
        setEditing(false);
      }
    } catch (error) {
      addToast("error", {
        title: "저장하지 못했습니다.",
        error: (error as Error).message,
      });
    }
  };

  const remove = async () => {
    if (!selected || !roleDeleteResource) return;
    const ok = await confirm({
      title: "권한 삭제",
      body: `${selected.name} 권한을 삭제할까요?`,
      confirmText: "삭제",
    });
    if (!ok) return;
    try {
      await roleDeleteResource.deleteRole(selected.id);
      addToast("success", { title: `${selected.name} 권한을 삭제했습니다.` });
      await reload();
      history.push(basePath);
    } catch (error) {
      addToast("error", {
        title: "삭제하지 못했습니다.",
        error: (error as Error).message,
      });
    }
  };

  const groups = [...new Set(model.pages.map((page) => page.group))];
  const isEditable = editing && !locked;

  const resourceCheckbox = (resource: Resource, pageEnabled: boolean) => {
    const required = requiredByEnabled.has(resource);
    const checked = required || view.resources.includes(resource);
    if (!isEditable) {
      const on = pageEnabled && checked;
      return (
        <span
          key={resource}
          className={on ? styles.resourceOn : styles.resourceOff}
        >
          <EuiIcon type={on ? "check" : "minus"} size="s" />
          {resourceLabel(resource)}
        </span>
      );
    }
    const box = (
      <EuiCheckbox
        id={`${idPrefix}-${resource}-${pageEnabled}`}
        label={resourceLabel(resource)}
        checked={pageEnabled && checked}
        disabled={!isEditable || !pageEnabled || required}
        onChange={(event) => toggleResource(resource, event.target.checked)}
        compressed={true}
      />
    );
    return required && isEditable && pageEnabled ? (
      <EuiToolTip
        key={resource}
        content="켜 둔 화면에 꼭 필요한 기능이라 함께 켜집니다"
      >
        {box}
      </EuiToolTip>
    ) : (
      <span key={resource}>{box}</span>
    );
  };

  return (
    <PageShell
      title="권한 관리"
      description="역할마다 볼 수 있는 화면과 쓸 수 있는 기능을 정합니다. 바뀐 권한은 다음 로그인부터 적용됩니다."
      actions={
        roleAddResource && (
          <EuiButton
            fill={true}
            iconType="plusInCircle"
            onClick={() => history.push(`${basePath}/add`)}
            isDisabled={creating}
          >
            권한 추가
          </EuiButton>
        )
      }
    >
      <div className={styles.layout}>
        <ul className={styles.roleList} aria-label="권한 목록">
          {loading && roles.length === 0 && <EuiLoadingSpinner />}
          {roles.map((role) => (
            <li key={role.id}>
              <button
                type="button"
                className={`${styles.roleItem} ${!creating && role.id === selected?.id ? styles.active : ""}`}
                onClick={() => history.push(`${basePath}/${role.id}`)}
              >
                <span className={styles.roleName}>
                  {role.name}
                  {role.isSystem && <EuiBadge color="hollow">기본</EuiBadge>}
                </span>
                <span className={styles.roleMeta}>
                  사용자 {role.userCount}명 · 화면 {role.pages.length}개
                </span>
              </button>
            </li>
          ))}
          {creating && (
            <li>
              <div className={`${styles.roleItem} ${styles.active}`}>
                <span className={styles.roleName}>새 권한</span>
              </div>
            </li>
          )}
        </ul>

        <div className={styles.detail}>
          {!selected && !creating ? (
            <p>권한을 골라 주세요.</p>
          ) : (
            <>
              <div className={styles.detailHeader}>
                {editing ? (
                  <div className={styles.fields}>
                    <EuiFormRow label="이름">
                      <EuiFieldText
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        maxLength={30}
                        compressed={true}
                      />
                    </EuiFormRow>
                    <EuiFormRow label="설명" fullWidth={true}>
                      <EuiFieldText
                        fullWidth={true}
                        value={form.description ?? ""}
                        onChange={(event) =>
                          setForm({ ...form, description: event.target.value })
                        }
                        maxLength={100}
                        compressed={true}
                      />
                    </EuiFormRow>
                  </div>
                ) : (
                  <div>
                    <h2 className={styles.detailTitle}>{selected?.name}</h2>
                    <p className={styles.detailDescription}>
                      {selected?.description || "설명 없음"}
                    </p>
                  </div>
                )}
                <div className={styles.detailActions}>
                  {editing ? (
                    <>
                      <EuiButtonEmpty
                        size="s"
                        onClick={() =>
                          creating ? history.push(basePath) : setEditing(false)
                        }
                      >
                        취소
                      </EuiButtonEmpty>
                      <EuiButton
                        size="s"
                        fill={true}
                        onClick={save}
                        isLoading={
                          roleAddResource?.loading || roleEditResource?.loading
                        }
                      >
                        저장
                      </EuiButton>
                    </>
                  ) : (
                    <>
                      {roleDeleteResource && selected && !selected.isSystem && (
                        <EuiButton size="s" color="danger" onClick={remove}>
                          삭제
                        </EuiButton>
                      )}
                      {canEdit && (
                        <EuiButton size="s" onClick={() => setEditing(true)}>
                          수정
                        </EuiButton>
                      )}
                    </>
                  )}
                </div>
              </div>

              {locked && (
                <EuiCallOut
                  size="s"
                  iconType="lock"
                  title="기본 관리자 권한은 모든 화면과 기능을 쓸 수 있으며 바꿀 수 없습니다. 이름과 설명만 수정할 수 있습니다."
                />
              )}

              {groups.map((group) => (
                <section key={group} className={styles.group}>
                  <h3 className={styles.groupTitle}>{group}</h3>
                  <table className={styles.matrix}>
                    <tbody>
                      {model.pages
                        .filter((page) => page.group === group)
                        .map((page) => {
                          const enabled = enabledPages.includes(page.page);
                          return (
                            <tr
                              key={page.page}
                              className={enabled ? "" : styles.off}
                            >
                              <th scope="row">
                                {isEditable ? (
                                  <EuiSwitch
                                    label={page.title}
                                    checked={enabled}
                                    onChange={(event) =>
                                      togglePage(
                                        page.page,
                                        event.target.checked,
                                      )
                                    }
                                    compressed={true}
                                  />
                                ) : (
                                  <span
                                    className={
                                      enabled ? styles.pageOn : styles.pageOff
                                    }
                                  >
                                    <EuiIcon
                                      type={
                                        enabled
                                          ? "checkInCircleFilled"
                                          : "minusInCircle"
                                      }
                                      color={enabled ? "success" : "subdued"}
                                    />
                                    {page.title}
                                  </span>
                                )}
                              </th>
                              <td>
                                <div className={styles.actions}>
                                  {page.optional.length === 0 ? (
                                    <span className={styles.none}>
                                      조회만 있는 화면
                                    </span>
                                  ) : (
                                    page.optional.map((resource) =>
                                      resourceCheckbox(resource, enabled),
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </section>
              ))}

              <section className={styles.group}>
                <h3 className={styles.groupTitle}>공통 기능</h3>
                <div className={styles.actions}>
                  {model.common.map((resource) =>
                    resourceCheckbox(resource, true),
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
