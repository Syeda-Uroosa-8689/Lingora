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
    label: "Student Management",
    icon: "🎓",
  },
  {
    id: "teachers",
    label: "Teacher Management",
    icon: "👩‍🏫",
  },
  {
    id: "pathways",
    label: "Pathways & Topics",
    icon: "📚",
  },
  {
    id: "progress",
    label: "Student Progress",
    icon: "📈",
  },
  {
    id: "results",
    label: "Results & Reports",
    icon: "🏆",
  },
];

const ICONS = {
  students: "🎓",
  teachers: "👩‍🏫",
  schools: "🏫",
  pathways: "📚",
  progress: "📈",
  results: "🏆",
  dashboard: "📊",
};

/* =========================================================
   ENTITY CONFIGS (drives the generic management pages)
========================================================= */

const ENTITY_CONFIG = {
  students: {
    title: "Student Management",
    dataKey: "students",
    listApi: "/api/admin/students",
    itemApi: "/api/admin/students",
    responseKey: "student",
    canDelete: false,
    columns: [
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "mobile", label: "Mobile" },
      {
        key: "school",
        label: "School",
        render: (r) =>
          r.school
            ? r.school.name
            : "—",
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
        render: (r) => fmtDate(r.createdAt),
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
        name: "school",
        label: "School",
        type: "select",
        optionsKey: "schools",
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
  },
  teachers: {
    title: "Teacher Management",
    dataKey: "teachers",
    listApi: "/api/admin/teachers",
    itemApi: "/api/admin/teachers",
    blockApiBase: "/api/admin/teachers",
    blockable: true,
    responseKey: "teacher",
    canAdd: true,
    canDelete: true,
    singular: "Teacher",
    columns: [
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "mobile", label: "Mobile" },
      {
        key: "school",
        label: "School",
        render: (r) =>
          r.school
            ? r.school.name
            : "—",
      },
      { key: "class", label: "Class" },
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
        render: (r) => fmtDate(r.createdAt),
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
        name: "class",
        label: "Class",
        type: "select",
        optionsKey: "classes",
      },
      {
        name: "isBlocked",
        label: "Blocked",
        type: "checkbox",
      },
    ],
  },
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

function PageTitle({ icon, title, subtitle }) {
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
    (students / teachers / schools)
========================================================= */

function EntityPage({ token, config, schools, schoolId, classes }) {
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
    const data =
      await request(
        token,
        config.listApi
      );
    if (data.success) {
      setItems(
        data[config.dataKey] || []
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
        `Remove ${name}: ${item.fullName || item.name}?`
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
    if (pending.has(item._id)) return;
    setPending((prev) =>
      new Set(prev).add(item._id)
    );
    const prevItems = items;
    const newState = !item.isBlocked;
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
          data.message || "Update failed."
        );
      }
      if (data[responseKey]) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === item._id
              ? {
                  ...i,
                  isBlocked:
                    data[responseKey].isBlocked,
                  isApproved:
                    data[responseKey].isApproved,
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
          No {config.title.toLowerCase()}
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
                {config.columns.map((c) => (
                  <th
                    key={c.key}
                  >
                    {c.label}
                  </th>
                ))}
                <th
                  className="db-th-actions"
                >
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
                  ))}
                  <td className="db-td-actions">
                    {config.blockable && (
                      <button
                        className={
                          item.isBlocked
                            ? "db-btn-sm db-btn-unblock"
                            : "db-btn-sm db-btn-block"
                        }
                        disabled={pending.has(item._id)}
                        onClick={() =>
                          toggleBlock(item)
                        }
                      >
                        {pending.has(item._id)
                          ? "..."
                          : item.isBlocked
                            ? "Allow"
                            : "Block"}
                      </button>
                    )}
                    <button
                      className="db-btn-sm db-btn-edit"
                      onClick={() => {
                        setModalItem(item);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
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
      {error && (
        <div className="db-error">
          {error}
        </div>
      )}

      {modalOpen && (
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
          classes={classes}
          schoolId={schoolId}
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
  schools,
  classes,
  schoolId,
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
        (f.optionsKey === "schools" ||
          f.optionsKey === "classes")
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

  const [values, setValues] =
    useState(() => init(item, fields));

  function setField(name, value) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...values };
    if (schoolId) {
      payload.schoolId = schoolId;
    }
    if (payload.password === "") {
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
    if (
      f.type === "select" &&
      f.optionsKey === "classes"
    ) {
      return (
        <select
          value={val || ""}
          onChange={(e) =>
            setField(
              f.name,
              e.target.value || ""
            )
          }
        >
          <option value="">
            Select Class
          </option>
          {classes.map((c) => (
            <option
              key={c._id}
              value={c.name}
            >
              {c.name}
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
        "/api/admin/summary"
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
        "/api/admin/students"
      );
      if (stu.success) {
        setStudents(stu.students || []);
      }
    })();
  }, [token]);

  const cards = summary
    ? [
        {
          label: "Total Students",
          value: summary.students,
        },
        {
          label: "Teachers",
          value: summary.teachers,
        },
        {
          label: "Pending Requests",
          value: summary.pendingRequests,
        },
        {
          label: "Results",
          value: summary.results,
        },
      ]
    : [];

  return (
    <div className="db-section">
      <PageTitle
        icon="📊"
        title="Admin Dashboard"
        subtitle="School management overview"
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
          Pending Signup Requests
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
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => !s.isApproved)
                  .map((s) => (
                    <tr key={s._id}>
                      <td>
                        {s.fullName ||
                          "—"}
                      </td>
                      <td>
                        {s.email || "—"}
                      </td>
                      <td>
                        {s.mobile ||
                          "—"}
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

/* =========================================================
   PATHWAYS & TOPICS (content tree)
========================================================= */

function PathwaysPage({ token }) {
  const [pathways, setPathways] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [modalOpen, setModalOpen] =
    useState(false);
  const [form, setForm] =
    useState({
      name: "",
      description: "",
      topics: "",
    });

  async function load() {
    setLoading(true);
    setError("");
    const data = await request(
      token,
      "/api/admin/pathways"
    );
    if (data.success) {
      setPathways(
        data.pathways || []
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

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    const topics = form.topics
      ? form.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => ({
            topic: t,
            subtopics: [],
          }))
      : [];
    const data = await request(
      token,
      "/api/admin/pathways",
      "POST",
      {
        name: form.name,
        description:
          form.description,
        topics,
      }
    );
    if (data.success) {
      setModalOpen(false);
      setForm({
        name: "",
        description: "",
        topics: "",
      });
      load();
    } else {
      setError(
        data.message || "Save failed."
      );
    }
  }

  async function remove(pw) {
    if (
      !confirm(
        `Remove pathway: ${pw.name}?`
      )
    ) {
      return;
    }
    const data = await request(
      token,
      `/api/admin/pathways/${pw._id}`,
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

  return (
    <div className="db-section">
      <PageTitle
        icon="📚"
        title="Pathways & Topics"
        subtitle="Manage English learning content"
      />

      <div className="db-section-head">
        <button
          className="db-btn db-btn-primary"
          onClick={() => setModalOpen(true)}
        >
          {" "}
          + Add Pathway
        </button>
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
        pathways.length === 0 && (
          <div className="db-empty-state">
            No pathways created yet.
          </div>
        )}

      {!loading && pathways.length > 0 && (
        <div className="db-tree">
          {pathways.map((pw) => (
            <details
              key={pw._id}
              className="db-tree-item"
            >
              <summary>
                <span className="db-tree-title">
                  {pw.name}
                </span>
                <span className="db-tree-actions">
                  <button
                    className="db-btn-sm db-btn-delete"
                    onClick={() =>
                      remove(pw)
                    }
                  >
                    Delete
                  </button>
                </span>
              </summary>
              <p className="db-tree-desc">
                {pw.description ||
                  "No description."}
              </p>
              {pw.topics &&
                pw.topics.length > 0 && (
                  <ul className="db-tree-list">
                    {pw.topics.map(
                      (t) => (
                        <li
                          key={t._id || t.topic}
                        >
                          <strong>
                            {t.topic}
                          </strong>
                          {t.subtopics &&
                            t.subtopics.length >
                              0 && (
                            <ul>
                              {t.subtopics.map(
                                (st) => (
                                  <li
                                    key={
                                      st._id ||
                                      st.subtopic
                                    }
                                  >
                                    {st.subtopic}
                                    {st.lessons &&
                                      st.lessons
                                        .length >
                                        0 && (
                                      <span>
                                        :
                                        {st.lessons
                                          .map(
                                            (l) =>
                                              l.title
                                          )
                                          .join(
                                            ", "
                                          )}{" "}
                                      </span>
                                    )}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
            </details>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="db-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="db-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3>
              Add Pathway
            </h3>
            <form
              className="db-form"
              onSubmit={save}
            >
              <div className="db-form-row">
                <label>
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setField(
                      "name",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
              <div className="db-form-row">
                <label>
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setField(
                      "description",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Topics (comma separated)
                </label>
                <input
                  type="text"
                  value={form.topics}
                  onChange={(e) =>
                    setField(
                      "topics",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Listen & Repeat, Speak, Interact"
                />
              </div>
              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn"
                  onClick={() =>
                    setModalOpen(false)
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="db-btn db-btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
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
  const [students, setStudents] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [formOpen, setFormOpen] =
    useState(false);
  const [form, setForm] =
    useState({
      user: "",
      pathway: "",
      topic: "",
      subtopic: "",
      lesson: "",
      activity: "",
      status: "completed",
      score: 0,
      maxScore: 0,
    });

  async function load() {
    setLoading(true);
    setError("");
    const [p, s] = await Promise.all([
      request(token, "/api/admin/progress"),
      request(
        token,
        "/api/admin/students"
      ),
    ]);
    if (p.success) {
      setItems(p.progress || []);
    } else {
      setError(
        p.message || "Failed."
      );
    }
    if (s.success) {
      setStudents(s.students || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    const data = await request(
      token,
      "/api/admin/progress",
      "POST",
      {
        user: form.user,
        school: form.school || null,
        pathway: form.pathway,
        topic: form.topic,
        subtopic: form.subtopic,
        lesson: form.lesson,
        activity: form.activity,
        status: form.status,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
      }
    );
    if (data.success) {
      setFormOpen(false);
      load();
    } else {
      setError(
        data.message || "Save failed."
      );
    }
  }

  return (
    <div className="db-section">
      <PageTitle
        icon="📈"
        title="Student Progress"
        subtitle="Completed topics, lessons and activity"
      />

      <div className="db-section-head">
        <button
          className="db-btn db-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {" "}
          + Record Progress
        </button>
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
          No progress recorded yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table db-table-sm">
            <thead>
              <tr>
                <th>Student</th>
                <th>Pathway</th>
                <th>Topic</th>
                <th>Subtopic</th>
                <th>Lesson</th>
                <th>Activity</th>
                <th>Status</th>
                <th>
                  Score
                </th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.user
                      ?.fullName || "—"}
                  </td>
                  <td>
                    {p.pathway || "—"}
                  </td>
                  <td>
                    {p.topic || "—"}
                  </td>
                  <td>
                    {p.subtopic || "—"}
                  </td>
                  <td>
                    {p.lesson || "—"}
                  </td>
                  <td>
                    {p.activity || "—"}
                  </td>
                  <td>
                    {p.status || "—"}
                  </td>
                  <td>
                    {p.score}
                    {" / "}
                    {p.maxScore}
                  </td>
                  <td>
                    {fmtDate(p.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div
          className="db-modal-backdrop"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="db-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3>
              Record Progress
            </h3>
            <form
              className="db-form"
              onSubmit={save}
            >
              <div className="db-form-row">
                <label>
                  Student
                </label>
                <select
                  value={form.user}
                  onChange={(e) =>
                    setField(
                      "user",
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select student
                  </option>
                  {students.map((s) => (
                    <option
                      key={s._id}
                      value={s._id}
                    >
                      {s.fullName ||
                        s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="db-form-row">
                <label>
                  Pathway
                </label>
                <input
                  type="text"
                  value={form.pathway}
                  onChange={(e) =>
                    setField(
                      "pathway",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Topic
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) =>
                    setField(
                      "topic",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Subtopic
                </label>
                <input
                  type="text"
                  value={form.subtopic}
                  onChange={(e) =>
                    setField(
                      "subtopic",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Lesson
                </label>
                <input
                  type="text"
                  value={form.lesson}
                  onChange={(e) =>
                    setField(
                      "lesson",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Activity
                </label>
                <input
                  type="text"
                  value={form.activity}
                  onChange={(e) =>
                    setField(
                      "activity",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="db-form-row">
                <label>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setField(
                      "status",
                      e.target.value
                    )
                  }
                >
                  <option value="completed">
                    Completed
                  </option>
                  <option value="in_progress">
                    In Progress
                  </option>
                </select>
              </div>
              <div className="db-form-row db-form-row-inline">
                <div>
                  <label>
                    Score
                  </label>
                  <input
                    type="number"
                    value={form.score}
                    onChange={(e) =>
                      setField(
                        "score",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label>
                    Max Score
                  </label>
                  <input
                    type="number"
                    value={form.maxScore}
                    onChange={(e) =>
                      setField(
                        "maxScore",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn"
                  onClick={() =>
                    setFormOpen(false)
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="db-btn db-btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RESULTS & REPORTS
========================================================= */

function ResultsPage({ token }) {
  const [items, setItems] =
    useState([]);
  const [students, setStudents] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [formOpen, setFormOpen] =
    useState(false);
  const [form, setForm] =
    useState({
      user: "",
      challengeType: "",
      score: 0,
      maxScore: 25,
      passed: false,
      answers: "",
    });

  async function load() {
    setLoading(true);
    setError("");
    const [r, s] = await Promise.all([
      request(token, "/api/admin/results"),
      request(
        token,
        "/api/admin/students"
      ),
    ]);
    if (r.success) {
      setItems(r.results || []);
    } else {
      setError(
        r.message || "Failed."
      );
    }
    if (s.success) {
      setStudents(s.students || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    let answers = [];
    if (form.answers) {
      try {
        answers =
          JSON.parse(form.answers);
      } catch {
        answers = form.answers
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
      }
    }
    const data = await request(
      token,
      "/api/admin/results",
      "POST",
      {
        user: form.user,
        school: form.school || null,
        challengeType:
          form.challengeType,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
        passed: form.passed,
        answers,
      }
    );
    if (data.success) {
      setFormOpen(false);
      load();
    } else {
      setError(
        data.message || "Save failed."
      );
    }
  }

  return (
    <div className="db-section">
      <PageTitle
        icon="🏆"
        title="Results & Reports"
        subtitle="Scores, final challenge results and learning reports"
      />

      <div className="db-section-head">
        <button
          className="db-btn db-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {" "}
          + Record Result
        </button>
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
          No results recorded yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table db-table-sm">
            <thead>
              <tr>
                <th>Student</th>
                <th>
                  Challenge
                </th>
                <th>
                  Score
                </th>
                <th>
                  Passed
                </th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.user
                      ?.fullName || "—"}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div
          className="db-modal-backdrop"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="db-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3>
              Record Result
            </h3>
            <form
              className="db-form"
              onSubmit={save}
            >
              <div className="db-form-row">
                <label>
                  Student
                </label>
                <select
                  value={form.user}
                  onChange={(e) =>
                    setField(
                      "user",
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select student
                  </option>
                  {students.map((s) => (
                    <option
                      key={s._id}
                      value={s._id}
                    >
                      {s.fullName ||
                        s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="db-form-row">
                <label>
                  Challenge Type
                </label>
                <input
                  type="text"
                  value={form.challengeType}
                  onChange={(e) =>
                    setField(
                      "challengeType",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Final Challenge 1"
                />
              </div>
              <div className="db-form-row db-form-row-inline">
                <div>
                  <label>
                    Score
                  </label>
                  <input
                    type="number"
                    value={form.score}
                    onChange={(e) =>
                      setField(
                        "score",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label>
                    Max Score
                  </label>
                  <input
                    type="number"
                    value={form.maxScore}
                    onChange={(e) =>
                      setField(
                        "maxScore",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="db-check-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.passed}
                      onChange={(e) =>
                        setField(
                          "passed",
                          e.target.checked
                        )
                      }
                    />
                    Passed
                  </label>
                </div>
              </div>
              <div className="db-form-row">
                <label>
                  Answers (JSON or comma list)
                </label>
                <input
                  type="text"
                  value={form.answers}
                  onChange={(e) =>
                    setField(
                      "answers",
                      e.target.value
                    )
                  }
                  placeholder='["q1","q2"]'
                />
              </div>
              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn"
                  onClick={() =>
                    setFormOpen(false)
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="db-btn db-btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
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
          Admin
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
    SIDEBAR.find((s) => s.id === active) ||
    {};
  return (
    <div className="db-header">
      <div>
        <h1>
          {label.label || "Admin"}
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

/* =========================================================
   MAIN DASHBOARD
========================================================= */

function AdminDashboard({ onBack }) {
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || ""
  );
  const [active, setActive] =
    useState("dashboard");
  const [schools, setSchools] =
    useState([]);
  const [schoolId, setSchoolId] =
    useState(
      localStorage.getItem("adminSchoolId") || ""
    );
  const [classes, setClasses] =
    useState([]);
  const [schoolName, setSchoolName] =
    useState("");

  useEffect(() => {
    if (token) {
      request(
        token,
        "/api/admin/schools"
      ).then((d) => {
        if (d.success) {
          const list = d.schools || [];
          setSchools(list);
          const match =
            list.find(
              (s) => s.schoolId === schoolId
            );
          if (match) {
            setSchoolName(match.name);
          }
        }
      });

      request(
        token,
        `/api/classes${
          schoolId
            ? "?schoolId=" + schoolId
            : ""
        }`
      ).then((d) => {
        if (d.success) {
          setClasses(d.classes || []);
        }
      });
    }
  }, [token, schoolId]);

  function handleLogout() {
    setToken("");
    localStorage.removeItem("adminToken");
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
              config={ENTITY_CONFIG.students}
              schools={schools}
            />
          )}
          {active === "teachers" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.teachers}
              schools={schools}
              classes={classes}
              schoolId={schoolId}
            />
          )}
          {active === "schools" && (
            <EntityPage
              token={token}
              config={ENTITY_CONFIG.schools}
              schools={schools}
            />
          )}
          {active === "pathways" && (
            <PathwaysPage
              token={token}
            />
          )}
          {active === "progress" && (
            <ProgressPage
              token={token}
            />
          )}
          {active === "results" && (
            <ResultsPage
              token={token}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
