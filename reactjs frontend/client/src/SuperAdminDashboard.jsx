import React, {
  useState,
  useEffect,
} from "react";

import "./adminDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

async function request(
  token,
  path,
  method = "GET",
  body
) {
  try {
    const opts = {
      headers: authHeaders(token),
    };
    if (method !== "GET") {
      opts.method = method;
      opts.headers["Content-Type"] =
        "application/json";
      if (body !== undefined) {
        opts.body =
          JSON.stringify(body);
      }
    }
    const res = await fetch(
      `${API_URL}${path}`,
      opts
    );
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message:
          "Server returned a non-JSON response.",
      };
    }
  } catch {
    return {
      success: false,
      message:
        "Backend server not running!",
    };
  }
}

function fmtDate(value) {
  if (!value) {
    return "";
  }
  try {
    return new Date(
      value
    ).toLocaleDateString();
  } catch {
    return value;
  }
}

const SIDEBAR = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    id: "schools",
    label: "School Management",
    icon: "🏫",
  },
  {
    id: "admins",
    label: "School Admin Management",
    icon: "👨‍💼",
  },
  {
    id: "teachers",
    label: "Teacher Management",
    icon: "👩\u200d🏫",
  },
  {
    id: "students",
    label: "Student Management",
    icon: "🎓",
  },
];

const ICONS = {
  schools: "🏫",
  admins: "👨‍💼",
  teachers: "👩\u200d🏫",
  students: "🎓",
  dashboard: "📊",
};

/* =========================================================
   GLOBAL ENTITY CONFIGS
   Super admin manages ALL users across all schools.
========================================================= */

const ENTITY_CONFIG = {
  schools: {
    title: "School Management",
    dataKey: "schools",
    listApi:
      "/api/superadmin/schools",
    itemApi:
      "/api/superadmin/schools",
    blockToggleApi: (id) =>
      `/api/superadmin/school/${id}/toggle-status`,
    blockable: true,
    responseKey: "school",
    canAdd: true,
    canDelete: true,
    singular: "School",
    columns: [
      {
        key: "schoolId",
        label: "School ID",
      },
      {
        key: "name",
        label: "Name",
      },
      {
        key: "address",
        label: "Address",
      },
      {
        key: "contactEmail",
        label: "Email",
      },
      {
        key: "contactPhone",
        label: "Phone",
      },
      {
        key: "established",
        label: "Established",
        render: (r) =>
          r.established
            ? fmtDate(r.established)
            : "—",
      },
      {
        key: "globalStatus",
        label: "Status",
        render: (r) =>
          r.globalStatus || "active",
      },
      {
        key: "createdAt",
        label: "Created",
        render: (r) => fmtDate(r.createdAt),
      },
    ],
    fields: [
      {
        name: "schoolId",
        label: "School ID",
        type: "text",
      },
      {
        name: "name",
        label: "School Name",
        type: "text",
      },
      {
        name: "address",
        label: "Address",
        type: "text",
      },
      {
        name: "contactEmail",
        label: "Contact Email",
        type: "email",
      },
      {
        name: "contactPhone",
        label: "Contact Phone",
        type: "text",
      },
      {
        name: "established",
        label: "Established",
        type: "date",
      },
      {
        name: "adminFullName",
        label: "Admin Full Name",
        type: "text",
      },
      {
        name: "adminEmail",
        label: "Admin Email",
        type: "email",
      },
      {
        name: "adminPassword",
        label: "Admin Password",
        type: "password",
      },
      {
        name: "adminMobile",
        label: "Admin Mobile",
        type: "text",
      },
    ],
  },
  admins: {
    title: "School Admin Management",
    dataKey: "admins",
    listApi:
      "/api/superadmin/admins",
    itemApi:
      "/api/superadmin/admins",
    blockToggleApi: (id) =>
      `/api/superadmin/admin/${id}/toggle-status`,
    blockable: true,
    responseKey: "admin",
    canAdd: false,
    canDelete: false,
    singular: "Admin",
    columns: [
      {
        key: "fullName",
        label: "Full Name",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "mobile",
        label: "Mobile",
      },
      {
        key: "school",
        label: "School",
        render: (r) =>
          r.school
            ? r.school.name
            : "—",
      },
      {
        key: "globalStatus",
        label: "Status",
        render: (r) =>
          r.globalStatus || "active",
      },
      {
        key: "createdAt",
        label: "Created",
        render: (r) => fmtDate(r.createdAt),
      },
    ],
    fields: [],
  },
  teachers: {
    title: "Teacher Management",
    dataKey: "teachers",
    listApi:
      "/api/superadmin/teachers",
    itemApi:
      "/api/superadmin/teachers",
    blockToggleApi: (id) =>
      `/api/superadmin/teacher/${id}/toggle-status`,
    blockable: true,
    responseKey: "teacher",
    canAdd: false,
    canDelete: false,
    singular: "Teacher",
    columns: [
      {
        key: "fullName",
        label: "Full Name",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "mobile",
        label: "Mobile",
      },
      {
        key: "school",
        label: "School",
        render: (r) =>
          r.school
            ? r.school.name
            : "—",
      },
      {
        key: "globalStatus",
        label: "Status",
        render: (r) =>
          r.globalStatus || "active",
      },
      {
        key: "createdAt",
        label: "Joined",
        render: (r) => fmtDate(r.createdAt),
      },
    ],
    fields: [],
  },
  students: {
    title: "Student Management",
    dataKey: "students",
    listApi:
      "/api/superadmin/students",
    itemApi:
      "/api/superadmin/students",
    blockToggleApi: (id) =>
      `/api/superadmin/student/${id}/toggle-status`,
    blockable: true,
    responseKey: "student",
    canAdd: false,
    canDelete: false,
    singular: "Student",
    columns: [
      {
        key: "fullName",
        label: "Full Name",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "mobile",
        label: "Mobile",
      },
      {
        key: "school",
        label: "School",
        render: (r) =>
          r.school
            ? r.school.name
            : "—",
      },
      {
        key: "globalStatus",
        label: "Status",
        render: (r) =>
          r.globalStatus || "active",
      },
      {
        key: "createdAt",
        label: "Joined",
        render: (r) => fmtDate(r.createdAt),
      },
    ],
    fields: [],
  },
};

function StatCard({ label, value }) {
  return (
    <div className="db-stat-card">
      <div className="db-stat-value">
        {value ?? 0}
      </div>
      <div className="db-stat-label">
        {label}
      </div>
    </div>
  );
}

function PageTitle({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="db-page-title">
      <span className="db-page-icon">
        {icon}
      </span>
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p className="db-page-subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function EntityPage({
  token,
  config,
  schools,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [modalOpen, setModalOpen] =
    useState(false);
  const [modalItem, setModalItem] =
    useState(null);
  const [pending, setPending] =
    useState(new Set());

  async function load() {
    setLoading(true);
    setError("");
    const data = await request(
      token,
      config.listApi
    );
    if (data.success) {
      setItems(
        data[config.dataKey] || []
      );
    } else {
      setError(
        data.message || "Failed to load."
      );
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token, config.listApi]);

  async function save(values) {
    setLoading(true);
    setError("");
    let data;
    if (modalItem) {
      data = await request(
        token,
        `${config.itemApi}/${modalItem._id}`,
        "PUT",
        values
      );
    } else {
      const addApi =
        config.addApi ||
        config.listApi;
      data = await request(
        token,
        addApi,
        "POST",
        values
      );
    }
    if (data.success) {
      setModalOpen(false);
      setModalItem(null);
      load();
    } else {
      setError(
        data.message || "Save failed."
      );
    }
    setLoading(false);
  }

  async function remove(item) {
    const name =
      config.singular || "item";
    if (
      !confirm(
        `Remove ${name}: ${
          item.fullName || item.name
        }?`
      )
    ) {
      return;
    }
    const data = await request(
      token,
      `${config.itemApi}/${item._id}`,
      "DELETE"
    );
    if (data.success) {
      load();
    } else {
      setError(
        data.message ||
          "Delete failed."
      );
    }
  }

  async function toggleStatus(item) {
    if (pending.has(item._id)) return;
    setPending((prev) =>
      new Set(prev).add(item._id)
    );

    const currentStatus =
      item.globalStatus || "active";
    const newStatus =
      currentStatus === "active"
        ? "inactive"
        : "active";

    const prevItems = items;

    setItems((prev) =>
      prev.map((i) =>
        i._id === item._id
          ? {
              ...i,
              globalStatus: newStatus,
            }
          : i
      )
    );

    try {
      const toggleApi =
        config.blockToggleApi
          ? config.blockToggleApi(item._id)
          : `${config.blockApiBase}/${item._id}/toggle-block`;

      const data = await request(
        token,
        toggleApi,
        "PUT"
      );

      if (!data.success) {
        throw new Error(
          data.message || "Update failed."
        );
      }

      const key =
        config.responseKey || "item";
      if (data[key]) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === item._id
              ? {
                  ...i,
                  globalStatus:
                    data[key]
                      .globalStatus ||
                    "active",
                }
              : i
          )
        );
      }
    } catch (err) {
      setItems(prevItems);
      setError(
        err.message || "Update failed."
      );
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    }
  }

  function cell(item, col) {
    if (col.render) {
      return col.render(item);
    }
    const raw = item[col.key];
    if (col.key === "school") {
      return raw
        ? raw.name
        : "—";
    }
    return raw !== undefined &&
      raw !== null
      ? String(raw)
      : "—";
  }

  return (
    <div className="db-section">
      <PageTitle
        icon={ICONS[config.dataKey]}
        title={config.title}
      />

      <div className="db-section-head">
        {config.canAdd && (
          <button
            className="db-btn db-btn-primary"
            onClick={() => {
              setModalItem(null);
              setModalOpen(true);
            }}
          >
            {" "}
            + Add {config.singular || "Item"}
          </button>
        )}
        <button
          className="db-btn db-btn-ghost"
          onClick={load}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="db-error">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="db-empty-state">
          No{" "}
          {config.title.toLowerCase()}
          ...
        </div>
      )}

      {loading && (
        <div className="db-loading">
          Loading...
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                {config.columns.map(
                  (c) => (
                    <th
                      key={c.key}
                    >
                      {c.label}
                    </th>
                  )
                )}
                <th className="db-th-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {config.columns.map(
                    (c) => (
                      <td
                        key={c.key}
                      >
                        {cell(item, c)}
                      </td>
                    )
                  )}
                  <td className="db-td-actions">
                    {config.blockable && (
                      <button
                        className={
                          item.globalStatus ===
                          "inactive"
                            ? "db-btn-sm db-btn-unblock"
                            : "db-btn-sm db-btn-block"
                        }
                        disabled={
                          pending.has(item._id)
                        }
                        onClick={() =>
                          toggleStatus(item)
                        }
                      >
                        {pending.has(item._id)
                          ? "..."
                          : item.globalStatus ===
                            "inactive"
                            ? "Active"
                            : "Inactive"}
                      </button>
                    )}
                    {config.fields &&
                      config.fields
                        .length > 0 && (
                        <button
                          className="db-btn-sm db-btn-edit"
                          onClick={() => {
                            setModalItem(item);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    {config.canDelete && (
                      <button
                        className="db-btn-sm db-btn-delete"
                        onClick={() =>
                          remove(item)
                        }
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && config.fields && (
        <FormModal
          key={
            modalItem
              ? modalItem._id
              : "new"
          }
          title={
            modalItem
              ? "Edit"
              : "Add"
          }
          subtitle={
            config.singular || "Item"
          }
          fields={config.fields}
          item={modalItem}
          schools={schools}
          loading={loading}
          onClose={() => {
            setModalOpen(false);
            setModalItem(null);
          }}
          onSave={(v) => save(v)}
        />
      )}
    </div>
  );
}

function FormModal({
  title,
  subtitle,
  fields,
  item,
  schools,
  loading,
  onClose,
  onSave,
}) {
  function init(item, fields) {
    const v = {};
    fields.forEach((f) => {
      const raw = item
        ? item[f.name]
        : undefined;
      if (f.type === "checkbox") {
        v[f.name] = raw
          ? true
          : false;
      } else if (
        f.type === "select" &&
        f.optionsKey === "schools"
      ) {
        v[f.name] =
          raw && raw._id
            ? raw._id
            : typeof raw === "string"
            ? raw
            : "";
      } else if (f.type === "date") {
        v[f.name] = toInputDate(raw);
      } else {
        v[f.name] =
          raw !== undefined &&
          raw !== null
          ? raw
          : "";
      }
    });
    return v;
  }

  const [values, setValues] = useState(
    () => init(item, fields)
  );

  function setField(name, value) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...values };
    if (payload.school === "") {
      payload.school = null;
    }
    if (payload.password === "") {
      delete payload.password;
    }
    onSave(payload);
  }

  function renderInput(f) {
    const val = values[f.name];
    if (f.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={!!val}
          onChange={(e) =>
            setField(
              f.name,
              e.target.checked
            )
          }
        />
      );
    }
    if (
      f.type === "select" &&
      f.optionsKey === "schools"
    ) {
      return (
        <select
          value={val || ""}
          onChange={(e) =>
            setField(
              f.name,
              e.target.value || null
            )
          }
        >
          <option value="">
            None
          </option>
          {schools.map((s) => (
            <option
              key={s._id}
              value={s._id}
            >
              {s.name}
            </option>
          ))}
        </select>
      );
    }
    if (f.type === "date") {
      return (
        <input
          type="date"
          value={val}
          onChange={(e) =>
            setField(
              f.name,
              e.target.value
            )
          }
        />
      );
    }
    return (
      <input
        type={f.type || "text"}
        value={val || ""}
        onChange={(e) =>
          setField(
            f.name,
            e.target.value
          )
        }
      />
    );
  }

  return (
    <div
      className="db-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="db-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h3>
          {title} {subtitle}
        </h3>
        <form
          className="db-form"
          onSubmit={handleSubmit}
        >
          {fields.map((f) => (
            <div
              className="db-form-row"
              key={f.name}
            >
              <label>
                {f.label}
              </label>
              {renderInput(f)}
            </div>
          ))}
          <div className="db-form-actions">
            <button
              type="button"
              className="db-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="db-btn db-btn-primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toInputDate(value) {
  if (!value) return "";
  try {
    return new Date(
      value
    ).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function DashboardHome({ token }) {
  const [summary, setSummary] =
    useState(null);
  const [schools, setSchools] =
    useState([]);
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const s = await request(
        token,
        "/api/superadmin/summary"
      );
      if (s.success) {
        setSummary(s);
      } else {
        setError(
          s.message || "Failed."
        );
      }
      const sch = await request(
        token,
        "/api/superadmin/schools"
      );
      if (sch.success) {
        setSchools(
          sch.schools || []
        );
      }
    })();
  }, [token]);

  const cards = summary
    ? [
        {
          label: "Total Schools",
          value: summary.schools,
        },
        {
          label: "School Admins",
          value: summary.admins,
        },
        {
          label: "Teachers",
          value: summary.teachers,
        },
        {
          label: "Students",
          value: summary.students,
        },
      ]
    : [];

  return (
    <div className="db-section">
      <PageTitle
        icon="📊"
        title="Super Admin Dashboard"
        subtitle="Global school management overview"
      />
      {error && (
        <div className="db-error">
          {error}
        </div>
      )}
      <div className="db-cards">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
          />
        ))}
      </div>

      <div className="db-sub-section">
        <h3>
          Schools Overview
        </h3>
        {schools.length === 0 ? (
          <div className="db-empty">
            No schools found.
          </div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table db-table-sm">
              <thead>
                <tr>
                   <th>Name</th>
                   <th>Email</th>
                   <th>Phone</th>
                   <th>
                     Status
                   </th>
                   <th>
                     Created
                   </th>
                 </tr>
               </thead>
               <tbody>
                 {schools.map((s) => (
                   <tr key={s._id}>
                     <td>
                       {s.name || "—"}
                     </td>
                     <td>
                       {s.contactEmail || "—"}
                     </td>
                     <td>
                       {s.contactPhone || "—"}
                     </td>
                     <td>
                       {s.globalStatus || "active"}
                     </td>
                     <td>
                       {fmtDate(s.createdAt)}
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  active,
  setActive,
  onLogout,
}) {
  return (
    <div className="db-sidebar">
      <div className="db-sidebar-head">
        <span className="db-logo">
          Fluento
        </span>
        <span className="db-logo-sub">
          Super Admin
        </span>
      </div>
      <nav className="db-nav">
        {SIDEBAR.map((item) => (
          <button
            key={item.id}
            className={
              "db-nav-item " +
              (active === item.id
                ? "db-nav-item-active"
                : "")
            }
            onClick={() => setActive(item.id)}
          >
            <span className="db-nav-icon">
              {item.icon}
            </span>
            <span>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <button
        className="db-nav-item db-logout"
        onClick={onLogout}
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  );
}

function Header({ active, onBack }) {
  const label =
    SIDEBAR.find((s) => s.id === active) ||
    {};
  return (
    <div className="db-header">
      <h1>
        {label.label || "Super Admin"}
      </h1>
      <button
        className="db-btn db-btn-ghost db-back"
        onClick={onBack}
      >
        Back to App
      </button>
    </div>
  );
}

function SuperAdminDashboard({ onBack }) {
  const [token, setToken] = useState(
    localStorage.getItem("superAdminToken") ||
      ""
  );
  const [active, setActive] =
    useState("dashboard");
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    if (token) {
      request(
        token,
        "/api/superadmin/schools"
      ).then((d) => {
        if (d.success) {
          setSchools(d.schools || []);
        }
      });
    }
  }, [token]);

  function handleLogout() {
    setToken("");
    localStorage.removeItem(
      "superAdminToken"
    );
    setActive("dashboard");
  }

  return (
    <div className="db-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        onLogout={handleLogout}
      />
      <div className="db-main">
        <Header
          active={active}
          onBack={onBack}
        />
        <div className="db-content">
          {active === "dashboard" && (
            <DashboardHome token={token} />
          )}
          {active === "schools" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.schools}
              schools={schools}
            />
          )}
          {active === "admins" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.admins}
              schools={schools}
            />
          )}
          {active === "teachers" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.teachers}
              schools={schools}
            />
          )}
          {active === "students" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.students}
              schools={schools}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
