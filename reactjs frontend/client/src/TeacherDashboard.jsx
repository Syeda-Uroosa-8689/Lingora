import React, {
  useState,
  useEffect,
} from "react";

import "./adminDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL;

const authHeaders =
  (token) => ({
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
    const contentType =
      res.headers.get(
        "content-type"
      );
    if (
      !contentType ||
      !contentType.includes(
        "application/json"
      )
    ) {
      const text =
        await res.text();
      return {
        success: false,
        message:
          `Server responded with status ${res.status}`,
      };
    }
    return res.json();
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

function toInputDate(value) {
  if (!value) {
    return "";
  }
  try {
    return new Date(
      value
    ).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

const SIDEBAR = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    id: "students",
    label: "My Students",
    icon: "🎓",
  },
  {
    id: "results",
    label: "Results & Reports",
    icon: "🏆",
  },
  {
    id: "progress",
    label: "Student Progress",
    icon: "📈",
  },
];

const ICONS = {
  students: "🎓",
  results: "🏆",
  progress: "📈",
  dashboard: "📊",
};

/* =========================================================
   ENTITY CONFIGS (drives the generic management pages)
   ========================================================= */

const STUDENT_ENTITY_CONFIG = {
  title: "My Students",
  dataKey: "students",
  listApi: "/api/teacher/students",
  itemApi:
    "/api/teacher/students",
  blockApiBase:
    "/api/teacher/students",
  blockable: true,
  responseKey: "student",
  canAdd: false,
  canDelete: true,
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
      key: "class",
      label: "Class",
    },
    {
      key: "isApproved",
      label: "Status",
      render: (r) =>
        r.isApproved
          ? "Approved"
          : "Pending",
    },
    {
      key: "isBlocked",
      label: "Access",
      render: (r) =>
        r.isBlocked
          ? "Blocked"
          : "Allowed",
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (r) =>
        fmtDate(r.createdAt),
    },
  ],
  fields: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
    },
    {
      name: "mobile",
      label: "Mobile",
      type: "text",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
    },
    {
      name: "isBlocked",
      label: "Blocked",
      type: "checkbox",
    },
    {
      name: "isApproved",
      label: "Approved",
      type: "checkbox",
    },
  ],
};

/* =========================================================
   SMALL PRESENTATIONAL HELPERS
   ========================================================= */

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

/* =========================================================
   GENERIC ENTITY MANAGEMENT PAGE
   ========================================================= */

function EntityPage({
  token,
  config,
}) {
  const [items, setItems] =
    useState([]);
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
    const data =
      await request(
        token,
        config.listApi
      );
    if (data.success) {
      setItems(
        data[config.dataKey] ||
          []
      );
    } else {
      setError(
        data.message ||
          "Failed to load."
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
        data.message ||
          "Save failed."
      );
    }
    setLoading(false);
  }

  async function remove(item) {
    const name =
      config.singular ||
      "item";
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

  async function toggleBlock(item) {
    if (pending.has(item._id))
      return;
    setPending((prev) =>
      new Set(prev).add(item._id)
    );
    const prevItems = items;
    const newState =
      !item.isBlocked;
    const responseKey =
      config.responseKey || "item";

    setItems((prev) =>
      prev.map((i) =>
        i._id === item._id
          ? {
              ...i,
              isBlocked: newState,
              isApproved: !newState,
            }
          : i
      )
    );

    try {
      const data = await request(
        token,
        `${config.blockApiBase}/${item._id}/toggle-block`,
        "PUT"
      );
      if (!data.success) {
        throw new Error(
          data.message ||
            "Update failed."
        );
      }
      if (data[responseKey]) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === item._id
              ? {
                  ...i,
                  isBlocked:
                    data[responseKey]
                      .isBlocked,
                  isApproved:
                    data[responseKey]
                      .isApproved,
                }
              : i
          )
        );
      }
    } catch (err) {
      setItems(prevItems);
      setError(
        err.message ||
          "Update failed."
      );
    } finally {
      setPending((prev) => {
        const next =
          new Set(prev);
        next.delete(item._id);
        return next;
      });
    }
  }

  function cell(item, col) {
    if (col.render) {
      return col.render(item);
    }
    const raw =
      item[col.key];
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
            + Add{" "}
            {config.singular ||
              "Item"}
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

      {!loading &&
        items.length === 0 && (
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
                <tr
                  key={item._id}
                >
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
                          item.isBlocked
                            ? "db-btn-sm db-btn-unblock"
                            : "db-btn-sm db-btn-block"
                        }
                        disabled={pending.has(
                          item._id
                        )}
                        onClick={() =>
                          toggleBlock(
                            item
                          )
                        }
                      >
                        {pending.has(
                          item._id
                        )
                          ? "..."
                          : item.isBlocked
                            ? "Allow"
                            : "Block"}
                      </button>
                    )}
                    {config.canEdit !==
                      false &&
                      config.itemApi && (
                      <button
                        className="db-btn-sm db-btn-edit"
                        onClick={() => {
                          setModalItem(
                            item
                          );
                          setModalOpen(
                            true
                          );
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

      {modalOpen && config.itemApi && (
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

/* =========================================================
   GENERIC FORM MODAL (add / edit)
   ========================================================= */

function FormModal({
  title,
  subtitle,
  fields,
  item,
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
      } else if (f.type === "date") {
        v[f.name] =
          toInputDate(raw);
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

  const [values, setValues] =
    useState(() =>
      init(item, fields)
    );

  useEffect(() => {
    setValues(
      init(item, fields)
    );
  }, [item]);

  function setField(name, value) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...values };
    if (
      payload.school === ""
    ) {
      payload.school = null;
    }
    if (
      payload.password === ""
    ) {
      delete payload.password;
    }
    onSave(payload);
  }

  function renderInput(f) {
    const val =
      values[f.name];
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

/* =========================================================
   DASHBOARD HOME (stat cards + pending requests)
   ========================================================= */

function DashboardHome({ token }) {
  const [summary, setSummary] =
    useState(null);
  const [students, setStudents] =
    useState([]);
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!token) {
      return;
    }
    (async () => {
      const s = await request(
        token,
        "/api/teacher/summary"
      );
      if (s.success) {
        setSummary(s.summary);
      } else {
        setError(
          s.message || "Failed."
        );
      }
      const stu = await request(
        token,
        "/api/teacher/students"
      );
      if (stu.success) {
        setStudents(
          stu.students || []
        );
      }
    })();
  }, [token]);

  const totalStudents =
    students.length;
  const approvedStudents =
    students.filter(
      (s) => s.isApproved
    ).length;
  const pendingStudents =
    students.filter(
      (s) => !s.isApproved
    ).length;

  const cards = summary
    ? [
        {
          label: "Total Students",
          value: totalStudents,
        },
        {
          label: "Approved Students",
          value: approvedStudents,
        },
        {
          label: "Pending Students",
          value: pendingStudents,
        },
        {
          label: "Results",
          value: summary.results,
        },
        {
          label:
            "Progress Records",
          value: summary.progress,
        },
      ]
    : [];

  return (
    <div className="db-section">
      <PageTitle
        icon="📊"
        title="Teacher Dashboard"
        subtitle="Student management overview"
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
          Pending Approval Requests
        </h3>
        {students.filter(
          (s) => !s.isApproved
        ).length === 0 ? (
          <div className="db-empty">
            No pending requests.
          </div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table db-table-sm">
              <thead>
                <tr>
                  <th>
                    Full Name
                  </th>
                  <th>
                    Email
                  </th>
                  <th>
                    Mobile
                  </th>
                  <th>
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter(
                    (s) =>
                      !s.isApproved
                  )
                  .map((s) => (
                    <tr
                      key={s._id}
                    >
                      <td>
                        {s.fullName ||
                          "—"}
                      </td>
                      <td>
                        {s.email ||
                          "—"}
                      </td>
                      <td>
                        {s.mobile ||
                          "—"}
                      </td>
                      <td>
                        {fmtDate(
                          s.createdAt
                        )}
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

/* =========================================================
   RESULTS & REPORTS
   ========================================================= */

function ResultsPage({ token }) {
  const [items, setItems] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");
    const data = await request(
      token,
      "/api/teacher/results"
    );
    if (data.success) {
      setItems(
        data.results || []
      );
    } else {
      setError(
        data.message || "Failed."
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  return (
    <div className="db-section">
      <PageTitle
        icon="🏆"
        title="Results & Reports"
        subtitle="Scores, final challenge results and learning reports"
      />

      <div className="db-section-head">
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

      {!loading &&
        items.length === 0 && (
          <div className="db-empty-state">
            No results recorded
            yet.
          </div>
        )}

      {loading && (
        <div className="db-loading">
          Loading...
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table db-table-sm">
            <thead>
              <tr>
                <th>
                  Student
                </th>
                <th>
                  Challenge
                </th>
                <th>
                  Score
                </th>
                <th>
                  Passed
                </th>
                <th>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(
                (r) => (
                  <tr
                    key={r._id}
                  >
                    <td>
                      {r.userName ||
                        "—"}
                    </td>
                    <td>
                      {r.challengeType ||
                        "—"}
                    </td>
                    <td>
                      {r.score}
                      {" / "}
                      {r.maxScore}
                    </td>
                    <td>
                      {r.passed
                        ? "✅ Yes"
                        : "❌ No"}
                    </td>
                    <td>
                      {fmtDate(
                        r.completedAt
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STUDENT PROGRESS
   ========================================================= */

function ProgressPage({ token }) {
  const [items, setItems] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");
    const data = await request(
      token,
      "/api/teacher/progress"
    );
    if (data.success) {
      setItems(
        data.progress || []
      );
    } else {
      setError(
        data.message || "Failed."
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  return (
    <div className="db-section">
      <PageTitle
        icon="📈"
        title="Student Progress"
        subtitle="Completed topics, lessons and activity"
      />

      <div className="db-section-head">
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

      {!loading &&
        items.length === 0 && (
          <div className="db-empty-state">
            No progress recorded
            yet.
          </div>
        )}

      {loading && (
        <div className="db-loading">
          Loading...
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table db-table-sm">
            <thead>
              <tr>
                <th>
                  Student
                </th>
                <th>
                  Pathway
                </th>
                <th>
                  Topic
                </th>
                <th>
                  Subtopic
                </th>
                <th>
                  Lesson
                </th>
                <th>
                  Activity
                </th>
                <th>
                  Status
                </th>
                <th>
                  Score
                </th>
                <th>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(
                (p) => (
                  <tr
                    key={p._id}
                  >
                    <td>
                      {p.userName ||
                        "—"}
                    </td>
                    <td>
                      {p.pathway ||
                        "—"}
                    </td>
                    <td>
                      {p.topic || "—"}
                    </td>
                    <td>
                      {p.subtopic ||
                        "—"}
                    </td>
                    <td>
                      {p.lesson ||
                        "—"}
                    </td>
                    <td>
                      {p.activity ||
                        "—"}
                    </td>
                    <td>
                      {p.status ||
                        "—"}
                    </td>
                    <td>
                      {p.score}
                      {" / "}
                      {p.maxScore}
                    </td>
                    <td>
                      {fmtDate(
                        p.completedAt
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR + HEADER
   ========================================================= */

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
          Teacher
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
            onClick={() =>
              setActive(item.id)
            }
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
        <span>
          🚪
        </span>
        <span>
          Logout
        </span>
      </button>
    </div>
  );
}

function Header({ active, onBack, schoolName }) {
  const label =
    SIDEBAR.find(
      (s) => s.id === active
    ) ||
    {};
  return (
    <div className="db-header">
      <div>
        <h1>
          {label.label ||
            "Teacher"}
        </h1>
        {schoolName && (
          <p className="db-school-name">
            {schoolName}
          </p>
        )}
      </div>
      <button
        className="db-btn db-btn-ghost db-back"
        onClick={onBack}
      >
        Back to App
      </button>
    </div>
  );
}

function TeacherDashboard({ onBack }) {
  const [token, setToken] =
    useState(
      localStorage.getItem(
        "teacherToken"
      ) || ""
    );

  const [active, setActive] =
    useState("dashboard");

  const [schoolName, setSchoolName] =
    useState("");

  useEffect(() => {
    const sid =
      localStorage.getItem("teacherSchoolId") || "";
    if (token && sid) {
      fetch(`${API_URL}/api/schools`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const match =
              (data.schools || []).find(
                (s) =>
                  s.schoolId === sid
              );
            if (match) {
              setSchoolName(match.name);
            }
          }
        })
        .catch(() => {});
    }
  }, [token]);

  function handleLogout() {
    setToken("");
    localStorage.removeItem(
      "teacherToken"
    );
    localStorage.removeItem(
      "teacher"
    );
    setActive("dashboard");
  }

  if (!token) {
    return (
      <div className="db-shell">
        <div className="db-main">
          <div className="db-content">
            <div className="db-section">
              <PageTitle
                icon="👩‍🏫"
                title="Teacher Access"
                subtitle="Authentication required"
              />
              <div className="db-error">
                No authentication
                token. Please log in
                via the main login
                page.
              </div>
              <button
                className="db-btn db-btn-ghost"
                onClick={onBack}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          schoolName={schoolName}
        />
        <div className="db-content">
          {active === "dashboard" && (
            <DashboardHome
              token={token}
            />
          )}
          {active === "students" && (
            <EntityPage
              token={token}
              config={
                STUDENT_ENTITY_CONFIG
              }
            />
          )}
          {active === "results" && (
            <ResultsPage
              token={token}
            />
          )}
          {active === "progress" && (
            <ProgressPage
              token={token}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
