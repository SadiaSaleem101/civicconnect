import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const categories = [
  "Roads",
  "Sanitation",
  "Electricity",
  "Water Supply",
  "Public Safety",
  "Other",
];

const statuses = ["Pending", "In Progress", "Resolved"];

const priorities = ["Low", "Medium", "High", "Critical"];

function App() {
  // ==============================
  // AUTHENTICATION
  // ==============================
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ==============================
  // APP STATES
  // ==============================
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState(
    localStorage.getItem("civicTheme") || "light"
  );

  // ==============================
  // ISSUES
  // ==============================
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState("");

  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    category: "Roads",
    location: "",
    priority: "Medium",
  });

  const [formMessage, setFormMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // ==============================
  // SEARCH / FILTER / SORT
  // ==============================
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("all");

  // ==============================
  // PAGINATION
  // ==============================
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 6;

  // ==============================
  // MODALS
  // ==============================
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);
  const [deleteIssue, setDeleteIssue] = useState(null);

  // ==============================
  // NOTIFICATIONS
  // ==============================
  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    text: "",
  });

  // ==============================
  // THEME
  // ==============================
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("civicTheme", theme);
  }, [theme]);

  // ==============================
  // AUTO HIDE NOTIFICATION
  // ==============================
  useEffect(() => {
    if (!notification.show) return;

    const timer = setTimeout(() => {
      setNotification((previous) => ({
        ...previous,
        show: false,
      }));
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification.show]);

  // ==============================
  // API HELPER
  // ==============================
  const showNotification = (text, type = "success") => {
    setNotification({
      show: true,
      text,
      type,
    });
  };

  // ==============================
  // LOAD ISSUES
  // ==============================
  const fetchIssues = async () => {
    if (!token) return;

    try {
      setIssuesLoading(true);
      setIssuesError("");

      const response = await fetch(`${API_URL}/issues`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch issues");
      }

      setIssues(data.issues || data || []);
    } catch (error) {
      console.error("Fetch Issues Error:", error);
      setIssuesError(error.message || "Unable to load issues");
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchIssues();
    }
  }, [token]);

  // ==============================
  // AUTH INPUT CHANGE
  // ==============================
  const handleAuthChange = (e) => {
    const { name, value } = e.target;

    setAuthForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==============================
  // LOGIN / REGISTER
  // ==============================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    setAuthMessage("");

    if (authMode === "register") {
      if (
        !authForm.name.trim() ||
        !authForm.email.trim() ||
        !authForm.password.trim() ||
        !authForm.confirmPassword.trim()
      ) {
        setAuthMessage("Please fill in all fields.");
        return;
      }

      if (authForm.password !== authForm.confirmPassword) {
        setAuthMessage("Passwords do not match.");
        return;
      }

      if (authForm.password.length < 6) {
        setAuthMessage("Password must be at least 6 characters.");
        return;
      }
    } else {
      if (!authForm.email.trim() || !authForm.password.trim()) {
        setAuthMessage("Please enter your email and password.");
        return;
      }
    }

    try {
      setAuthLoading(true);

      const endpoint =
        authMode === "login"
          ? `${API_URL}/auth/login`
          : `${API_URL}/auth/register`;

      const requestBody =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(data.message || "Authentication failed.");
        return;
      }

      // REGISTER SUCCESS
      if (authMode === "register") {
        setAuthMessage(
          "Account created successfully! Please login."
        );

        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          setAuthMode("login");
          setAuthMessage("");
        }, 1500);

        return;
      }

      // LOGIN SUCCESS
      if (!data.token) {
        setAuthMessage("Login failed. Token not received.");
        return;
      }

      localStorage.setItem("token", data.token);

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setToken(data.token);
      setUser(data.user || null);

      setAuthForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      showNotification(
        "Login successful! Welcome to CivicConnect."
      );
    } catch (error) {
      console.error("Authentication Error:", error);

      setAuthMessage(
        "Unable to connect to the server. Make sure your backend is running."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ==============================
  // SWITCH LOGIN / REGISTER
  // ==============================
  const switchAuthMode = () => {
    setAuthMode((previous) =>
      previous === "login" ? "register" : "login"
    );

    setAuthMessage("");

    setAuthForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setIssues([]);
    setActivePage("dashboard");

    showNotification("You have been logged out.");
  };

  // ==============================
  // ISSUE FORM CHANGE
  // ==============================
  const handleIssueChange = (e) => {
    const { name, value } = e.target;

    setIssueForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==============================
  // CREATE ISSUE
  // ==============================
  const handleCreateIssue = async (e) => {
    e.preventDefault();

    setFormMessage("");

    if (
      !issueForm.title.trim() ||
      !issueForm.description.trim() ||
      !issueForm.category ||
      !issueForm.location.trim()
    ) {
      setFormMessage("Please fill in all required fields.");
      return;
    }

    try {
      setFormLoading(true);

      const response = await fetch(`${API_URL}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(issueForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to report issue"
        );
      }

      setIssueForm({
        title: "",
        description: "",
        category: "Roads",
        location: "",
        priority: "Medium",
      });

      setFormMessage("");
      showNotification("Issue reported successfully!");

      setActivePage("issues");

      await fetchIssues();
    } catch (error) {
      console.error("Create Issue Error:", error);

      setFormMessage(
        error.message || "Failed to report issue."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ==============================
  // UPDATE ISSUE
  // ==============================
  const handleUpdateIssue = async (e) => {
    e.preventDefault();

    if (!editingIssue) return;

    try {
      const response = await fetch(
        `${API_URL}/issues/${editingIssue._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: editingIssue.status,
            priority: editingIssue.priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update issue"
        );
      }

      showNotification("Issue updated successfully!");
      setEditingIssue(null);

      await fetchIssues();
    } catch (error) {
      showNotification(
        error.message || "Failed to update issue",
        "error"
      );
    }
  };

  // ==============================
  // DELETE ISSUE
  // ==============================
  const handleDeleteIssue = async () => {
    if (!deleteIssue) return;

    try {
      const response = await fetch(
        `${API_URL}/issues/${deleteIssue._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete issue"
        );
      }

      setDeleteIssue(null);
      setSelectedIssue(null);

      showNotification("Issue deleted successfully!");

      await fetchIssues();
    } catch (error) {
      showNotification(
        error.message || "Failed to delete issue",
        "error"
      );
    }
  };

  // ==============================
  // STATISTICS
  // ==============================
  const statistics = useMemo(() => {
    const total = issues.length;

    const pending = issues.filter(
      (issue) => issue.status === "Pending"
    ).length;

    const inProgress = issues.filter(
      (issue) => issue.status === "In Progress"
    ).length;

    const resolved = issues.filter(
      (issue) => issue.status === "Resolved"
    ).length;

    const highPriority = issues.filter(
      (issue) =>
        issue.priority === "High" ||
        issue.priority === "Critical"
    ).length;

    const resolutionRate =
      total === 0
        ? 0
        : Math.round((resolved / total) * 100);

    return {
      total,
      pending,
      inProgress,
      resolved,
      highPriority,
      resolutionRate,
    };
  }, [issues]);

  // ==============================
  // FILTERED ISSUES
  // ==============================
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    if (viewMode === "my") {
      result = result.filter((issue) => {
        const reporterId =
          issue.reportedBy?._id ||
          issue.reportedBy ||
          "";

        return reporterId === user?._id;
      });
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((issue) => {
        return (
          issue.title?.toLowerCase().includes(search) ||
          issue.description?.toLowerCase().includes(search) ||
          issue.location?.toLowerCase().includes(search) ||
          issue.category?.toLowerCase().includes(search)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (issue) => issue.status === statusFilter
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter(
        (issue) => issue.category === categoryFilter
      );
    }

    if (priorityFilter !== "All") {
      result = result.filter(
        (issue) => issue.priority === priorityFilter
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(
        a.createdAt || a.updatedAt || 0
      );

      const dateB = new Date(
        b.createdAt || b.updatedAt || 0
      );

      if (sortBy === "oldest") {
        return dateA - dateB;
      }

      if (sortBy === "title") {
        return (a.title || "").localeCompare(
          b.title || ""
        );
      }

      if (sortBy === "priority") {
        const order = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };

        return (
          (order[b.priority] || 0) -
          (order[a.priority] || 0)
        );
      }

      return dateB - dateA;
    });

    return result;
  }, [
    issues,
    searchTerm,
    statusFilter,
    categoryFilter,
    priorityFilter,
    sortBy,
    viewMode,
    user,
  ]);

  // ==============================
  // PAGINATION
  // ==============================
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    priorityFilter,
    sortBy,
    viewMode,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIssues.length / issuesPerPage)
  );

  const startIndex =
    (currentPage - 1) * issuesPerPage;

  const paginatedIssues = filteredIssues.slice(
    startIndex,
    startIndex + issuesPerPage
  );

  // ==============================
  // HELPERS
  // ==============================
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getUserName = () => {
    if (user?.name) return user.name;

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "Citizen";
  };

  const getInitials = () => {
    const userName = getUserName();

    return userName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // ==============================
  // AUTH PAGE
  // ==============================
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="brand">
            Civic<span>Connect</span>
          </div>

          <div className="auth-content">
            <p className="eyebrow">
              SMART CIVIC REPORTING PLATFORM
            </p>

            <h1>
              Build better communities
              <span> together.</span>
            </h1>

            <p className="auth-description">
              Report civic problems, track their progress,
              and help create cleaner, safer and smarter
              communities.
            </p>

            <div className="feature-list">
              <div>
                <span>✓</span>
                Report civic issues easily
              </div>

              <div>
                <span>✓</span>
                Track issue status in real time
              </div>

              <div>
                <span>✓</span>
                Help improve your community
              </div>
            </div>
          </div>

          <p className="auth-footer">
            © 2026 CivicConnect
          </p>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <p className="eyebrow">
              {authMode === "login"
                ? "WELCOME BACK"
                : "JOIN CIVICCONNECT"}
            </p>

            <h2>
              {authMode === "login"
                ? "Welcome back!"
                : "Create your account"}
            </h2>

            <p className="auth-subtitle">
              {authMode === "login"
                ? "Login to manage and track civic issues."
                : "Start making a difference in your community."}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div className="input-group">
                  <label>Full Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={authForm.name}
                    onChange={handleAuthChange}
                  />
                </div>
              )}

              <div className="input-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                />
              </div>

              <div className="input-group">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                />
              </div>

              {authMode === "register" && (
                <div className="input-group">
                  <label>Confirm Password</label>

                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={authForm.confirmPassword}
                    onChange={handleAuthChange}
                  />
                </div>
              )}

              {authMessage && (
                <p
                  className={
                    authMessage
                      .toLowerCase()
                      .includes("success")
                      ? "form-success"
                      : "form-error"
                  }
                >
                  {authMessage}
                </p>
              )}

              <button
                className="auth-button"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Login →"
                  : "Create Account →"}
              </button>
            </form>

            <div className="auth-switch">
              <span>
                {authMode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>

              <button
                type="button"
                onClick={switchAuthMode}
              >
                {authMode === "login"
                  ? "Sign up"
                  : "Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // MAIN APP
  // ==============================
  return (
    <div className={`app ${sidebarOpen ? "sidebar-active" : ""}`}>
      {/* NOTIFICATION */}
      {notification.show && (
        <div
          className={`notification ${notification.type}`}
        >
          <span>
            {notification.type === "success"
              ? "✓"
              : "!"}
          </span>

          <p>{notification.text}</p>

          <button
            onClick={() =>
              setNotification((previous) => ({
                ...previous,
                show: false,
              }))
            }
          >
            ×
          </button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          Civic<span>Connect</span>
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {getInitials()}
          </div>

          <div>
            <h4>{getUserName()}</h4>
            <p>{user?.email || "Citizen"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              activePage === "dashboard"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setActivePage("dashboard");
              setSidebarOpen(false);
            }}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              activePage === "issues"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setActivePage("issues");
              setSidebarOpen(false);
            }}
          >
            <span>▣</span>
            All Issues
          </button>

          <button
            className={
              activePage === "report"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setActivePage("report");
              setSidebarOpen(false);
            }}
          >
            <span>＋</span>
            Report Issue
          </button>

          <button
            className={
              activePage === "analytics"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setActivePage("analytics");
              setSidebarOpen(false);
            }}
          >
            <span>▥</span>
            Analytics
          </button>

          <button
            className={
              activePage === "profile"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setActivePage("profile");
              setSidebarOpen(false);
            }}
          >
            <span>◉</span>
            Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="theme-button"
            onClick={() =>
              setTheme(
                theme === "light" ? "dark" : "light"
              )
            }
          >
            <span>
              {theme === "light" ? "☾" : "☀"}
            </span>

            {theme === "light"
              ? "Dark Mode"
              : "Light Mode"}
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-wrapper">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen((previous) => !previous)
            }
          >
            ☰
          </button>

          <div>
            <h2>
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "issues" &&
                "Civic Issues"}

              {activePage === "report" &&
                "Report an Issue"}

              {activePage === "analytics" &&
                "Analytics"}

              {activePage === "profile" &&
                "My Profile"}
            </h2>

            <p>
              {activePage === "dashboard" &&
                "Overview of civic issues and community activity"}

              {activePage === "issues" &&
                "Search, filter and manage reported issues"}

              {activePage === "report" &&
                "Help improve your community by reporting an issue"}

              {activePage === "analytics" &&
                "Track issue resolution and community statistics"}

              {activePage === "profile" &&
                "Manage your CivicConnect account"}
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchIssues}
            disabled={issuesLoading}
          >
            {issuesLoading ? "Loading..." : "↻ Refresh"}
          </button>
        </header>

        <main className="main-content">
          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">
                    CIVICCONNECT DASHBOARD
                  </p>

                  <h1>
                    Hello, {getUserName()} 👋
                  </h1>

                  <p>
                    Here's what's happening in your community.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setActivePage("report")
                  }
                >
                  + Report New Issue
                </button>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">▣</div>
                  <div>
                    <p>Total Issues</p>
                    <h3>{statistics.total}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">◷</div>
                  <div>
                    <p>Pending</p>
                    <h3>{statistics.pending}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">↻</div>
                  <div>
                    <p>In Progress</p>
                    <h3>{statistics.inProgress}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div>
                    <p>Resolved</p>
                    <h3>{statistics.resolved}</h3>
                  </div>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Recent Issues</h3>
                      <p>
                        Latest civic issues reported
                      </p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setActivePage("issues")
                      }
                    >
                      View All →
                    </button>
                  </div>

                  {issuesLoading ? (
                    <div className="loading-state">
                      Loading issues...
                    </div>
                  ) : issues.length === 0 ? (
                    <div className="empty-state">
                      <div>📋</div>
                      <h3>No issues yet</h3>
                      <p>
                        Start by reporting a civic issue.
                      </p>
                    </div>
                  ) : (
                    <div className="recent-list">
                      {issues.slice(0, 5).map((issue) => (
                        <div
                          className="recent-item"
                          key={issue._id}
                          onClick={() =>
                            setSelectedIssue(issue)
                          }
                        >
                          <div>
                            <h4>{issue.title}</h4>
                            <p>
                              📍 {issue.location}
                            </p>
                          </div>

                          <span
                            className={`status-badge ${issue.status
                              ?.toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {issue.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Resolution Progress</h3>
                      <p>
                        Overall community issue resolution
                      </p>
                    </div>
                  </div>

                  <div className="resolution-box">
                    <div className="resolution-number">
                      {statistics.resolutionRate}%
                    </div>

                    <p>Issues successfully resolved</p>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${statistics.resolutionRate}%`,
                        }}
                      ></div>
                    </div>

                    <div className="resolution-details">
                      <span>
                        Resolved:
                        <strong>
                          {statistics.resolved}
                        </strong>
                      </span>

                      <span>
                        Remaining:
                        <strong>
                          {statistics.total -
                            statistics.resolved}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ALL ISSUES */}
          {activePage === "issues" && (
            <>
              <section className="issues-toolbar">
                <div className="search-box">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                  />
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setActivePage("report")
                  }
                >
                  + Report Issue
                </button>
              </section>

              <section className="filter-panel">
                <div className="filter-group">
                  <label>View</label>

                  <select
                    value={viewMode}
                    onChange={(e) =>
                      setViewMode(e.target.value)
                    }
                  >
                    <option value="all">
                      All Issues
                    </option>

                    <option value="my">
                      My Issues
                    </option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                  >
                    <option>All</option>

                    {statuses.map((status) => (
                      <option key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Category</label>

                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(e.target.value)
                    }
                  >
                    <option>All</option>

                    {categories.map((category) => (
                      <option key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Priority</label>

                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value)
                    }
                  >
                    <option>All</option>

                    {priorities.map((priority) => (
                      <option key={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Sort By</label>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                  >
                    <option value="newest">
                      Newest First
                    </option>

                    <option value="oldest">
                      Oldest First
                    </option>

                    <option value="title">
                      Title A-Z
                    </option>

                    <option value="priority">
                      Priority
                    </option>
                  </select>
                </div>
              </section>

              {issuesError && (
                <div className="error-box">
                  {issuesError}
                </div>
              )}

              <div className="issues-count">
                Showing {paginatedIssues.length} of{" "}
                {filteredIssues.length} issues
              </div>

              {issuesLoading ? (
                <div className="loading-state large">
                  Loading civic issues...
                </div>
              ) : paginatedIssues.length === 0 ? (
                <div className="empty-state large">
                  <div>🔎</div>
                  <h3>No issues found</h3>
                  <p>
                    Try changing your search or filters.
                  </p>
                </div>
              ) : (
                <section className="issues-grid">
                  {paginatedIssues.map((issue) => (
                    <article
                      className="issue-card"
                      key={issue._id}
                    >
                      <div className="issue-card-top">
                        <span className="category-badge">
                          {issue.category}
                        </span>

                        <span
                          className={`priority-badge ${issue.priority
                            ?.toLowerCase() || "medium"}`}
                        >
                          {issue.priority || "Medium"}
                        </span>
                      </div>

                      <h3>{issue.title}</h3>

                      <p className="issue-description">
                        {issue.description}
                      </p>

                      <div className="issue-meta">
                        <span>
                          📍 {issue.location}
                        </span>

                        <span>
                          📅{" "}
                          {formatDate(
                            issue.createdAt
                          )}
                        </span>
                      </div>

                      <div className="issue-card-footer">
                        <span
                          className={`status-badge ${issue.status
                            ?.toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {issue.status || "Pending"}
                        </span>

                        <div className="issue-actions">
                          <button
                            onClick={() =>
                              setSelectedIssue(issue)
                            }
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              setEditingIssue({
                                ...issue,
                                priority:
                                  issue.priority ||
                                  "Medium",
                                status:
                                  issue.status ||
                                  "Pending",
                              })
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-action"
                            onClick={() =>
                              setDeleteIssue(issue)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (previous) =>
                          previous - 1
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <span>
                    Page {currentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (previous) =>
                          previous + 1
                      )
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* REPORT ISSUE */}
          {activePage === "report" && (
            <section className="report-page">
              <div className="report-intro">
                <p className="eyebrow">
                  COMMUNITY ACTION
                </p>

                <h1>Report a civic issue</h1>

                <p>
                  Provide accurate details so the issue can
                  be tracked and resolved efficiently.
                </p>
              </div>

              <form
                className="report-form"
                onSubmit={handleCreateIssue}
              >
                <div className="form-row">
                  <div className="input-group">
                    <label>
                      Issue Title *
                    </label>

                    <input
                      type="text"
                      name="title"
                      placeholder="Example: Damaged road near main junction"
                      value={issueForm.title}
                      onChange={handleIssueChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Category *</label>

                    <select
                      name="category"
                      value={issueForm.category}
                      onChange={handleIssueChange}
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Description *</label>

                  <textarea
                    name="description"
                    rows="6"
                    placeholder="Describe the civic issue clearly..."
                    value={issueForm.description}
                    onChange={handleIssueChange}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Location *</label>

                    <input
                      type="text"
                      name="location"
                      placeholder="Enter the exact location"
                      value={issueForm.location}
                      onChange={handleIssueChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Priority</label>

                    <select
                      name="priority"
                      value={issueForm.priority}
                      onChange={handleIssueChange}
                    >
                      {priorities.map(
                        (priority) => (
                          <option
                            key={priority}
                            value={priority}
                          >
                            {priority}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {formMessage && (
                  <div className="form-error">
                    {formMessage}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIssueForm({
                        title: "",
                        description: "",
                        category: "Roads",
                        location: "",
                        priority: "Medium",
                      });

                      setFormMessage("");
                    }}
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Submitting..."
                      : "Submit Report →"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ANALYTICS */}
          {activePage === "analytics" && (
            <section className="analytics-page">
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">▣</div>
                  <div>
                    <p>Total Issues</p>
                    <h3>{statistics.total}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⚠</div>
                  <div>
                    <p>High Priority</p>
                    <h3>
                      {statistics.highPriority}
                    </h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div>
                    <p>Resolved</p>
                    <h3>
                      {statistics.resolved}
                    </h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">%</div>
                  <div>
                    <p>Resolution Rate</p>
                    <h3>
                      {statistics.resolutionRate}%
                    </h3>
                  </div>
                </div>
              </section>

              <div className="analytics-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Issues by Status</h3>
                      <p>
                        Current resolution progress
                      </p>
                    </div>
                  </div>

                  <div className="bar-chart">
                    <div className="chart-row">
                      <span>Pending</span>

                      <div className="chart-track">
                        <div
                          className="chart-bar"
                          style={{
                            width: `${
                              statistics.total
                                ? (statistics.pending /
                                    statistics.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <strong>
                        {statistics.pending}
                      </strong>
                    </div>

                    <div className="chart-row">
                      <span>In Progress</span>

                      <div className="chart-track">
                        <div
                          className="chart-bar"
                          style={{
                            width: `${
                              statistics.total
                                ? (statistics.inProgress /
                                    statistics.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <strong>
                        {statistics.inProgress}
                      </strong>
                    </div>

                    <div className="chart-row">
                      <span>Resolved</span>

                      <div className="chart-track">
                        <div
                          className="chart-bar"
                          style={{
                            width: `${
                              statistics.total
                                ? (statistics.resolved /
                                    statistics.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <strong>
                        {statistics.resolved}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Performance Summary</h3>
                      <p>
                        Community issue management overview
                      </p>
                    </div>
                  </div>

                  <div className="performance-list">
                    <div>
                      <span>Resolution Rate</span>

                      <strong>
                        {statistics.resolutionRate}%
                      </strong>
                    </div>

                    <div>
                      <span>Pending Issues</span>

                      <strong>
                        {statistics.pending}
                      </strong>
                    </div>

                    <div>
                      <span>Issues in Progress</span>

                      <strong>
                        {statistics.inProgress}
                      </strong>
                    </div>

                    <div>
                      <span>Urgent Issues</span>

                      <strong>
                        {statistics.highPriority}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PROFILE */}
          {activePage === "profile" && (
            <section className="profile-page">
              <div className="profile-card">
                <div className="profile-cover"></div>

                <div className="profile-info">
                  <div className="profile-avatar">
                    {getInitials()}
                  </div>

                  <h2>{getUserName()}</h2>

                  <p>{user?.email}</p>

                  <span className="member-badge">
                    CivicConnect Member
                  </span>
                </div>

                <div className="profile-stats">
                  <div>
                    <strong>
                      {
                        issues.filter((issue) => {
                          const reporterId =
                            issue.reportedBy?._id ||
                            issue.reportedBy ||
                            "";

                          return (
                            reporterId === user?._id
                          );
                        }).length
                      }
                    </strong>

                    <span>My Reports</span>
                  </div>

                  <div>
                    <strong>
                      {
                        issues.filter((issue) => {
                          const reporterId =
                            issue.reportedBy?._id ||
                            issue.reportedBy ||
                            "";

                          return (
                            reporterId === user?._id &&
                            issue.status ===
                              "Resolved"
                          );
                        }).length
                      }
                    </strong>

                    <span>Resolved</span>
                  </div>

                  <div>
                    <strong>
                      {statistics.resolutionRate}%
                    </strong>

                    <span>Community Rate</span>
                  </div>
                </div>
              </div>

              <div className="panel account-panel">
                <div className="panel-header">
                  <div>
                    <h3>Account Information</h3>
                    <p>
                      Your CivicConnect account details
                    </p>
                  </div>
                </div>

                <div className="account-details">
                  <div>
                    <span>Full Name</span>
                    <strong>{getUserName()}</strong>
                  </div>

                  <div>
                    <span>Email Address</span>
                    <strong>{user?.email}</strong>
                  </div>

                  <div>
                    <span>Account Status</span>
                    <strong className="active-text">
                      Active
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ISSUE DETAILS MODAL */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() =>
                setSelectedIssue(null)
              }
            >
              ×
            </button>

            <p className="eyebrow">
              ISSUE DETAILS
            </p>

            <h2>{selectedIssue.title}</h2>

            <div className="modal-badges">
              <span className="category-badge">
                {selectedIssue.category}
              </span>

              <span
                className={`priority-badge ${selectedIssue.priority
                  ?.toLowerCase() || "medium"}`}
              >
                {selectedIssue.priority || "Medium"}
              </span>

              <span
                className={`status-badge ${selectedIssue.status
                  ?.toLowerCase()
                  .replace(" ", "-")}`}
              >
                {selectedIssue.status || "Pending"}
              </span>
            </div>

            <div className="modal-detail">
              <label>Description</label>
              <p>
                {selectedIssue.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="modal-detail">
              <label>Location</label>
              <p>📍 {selectedIssue.location}</p>
            </div>

            <div className="modal-detail">
              <label>Reported On</label>
              <p>
                📅{" "}
                {formatDate(
                  selectedIssue.createdAt
                )}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setEditingIssue({
                    ...selectedIssue,
                    priority:
                      selectedIssue.priority ||
                      "Medium",
                    status:
                      selectedIssue.status ||
                      "Pending",
                  });

                  setSelectedIssue(null);
                }}
              >
                Edit Issue
              </button>

              <button
                className="delete-button"
                onClick={() => {
                  setDeleteIssue(selectedIssue);
                  setSelectedIssue(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingIssue && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <button
              className="modal-close"
              onClick={() =>
                setEditingIssue(null)
              }
            >
              ×
            </button>

            <p className="eyebrow">
              UPDATE ISSUE
            </p>

            <h2>{editingIssue.title}</h2>

            <form onSubmit={handleUpdateIssue}>
              <div className="input-group">
                <label>Status</label>

                <select
                  value={editingIssue.status}
                  onChange={(e) =>
                    setEditingIssue(
                      (previous) => ({
                        ...previous,
                        status: e.target.value,
                      })
                    )
                  }
                >
                  {statuses.map((status) => (
                    <option key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Priority</label>

                <select
                  value={editingIssue.priority}
                  onChange={(e) =>
                    setEditingIssue(
                      (previous) => ({
                        ...previous,
                        priority: e.target.value,
                      })
                    )
                  }
                >
                  {priorities.map(
                    (priority) => (
                      <option key={priority}>
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditingIssue(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteIssue && (
        <div className="modal-overlay">
          <div className="modal small-modal delete-modal">
            <div className="delete-icon">!</div>

            <h2>Delete this issue?</h2>

            <p>
              Are you sure you want to delete
              <strong> "{deleteIssue.title}"</strong>?
              This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setDeleteIssue(null)
                }
              >
                Cancel
              </button>

              <button
                className="delete-button"
                onClick={handleDeleteIssue}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;