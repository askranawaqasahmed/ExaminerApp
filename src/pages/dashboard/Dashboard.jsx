import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const metrics = [
  { label: "Open Exams", value: 12, tone: "primary" },
  { label: "Pending Reviews", value: 5, tone: "warning" },
  { label: "Published Results", value: 28, tone: "success" },
  { label: "API Operations", value: 0, tone: "muted" },
];

const recentActivity = [
  { title: "Exam schedule updated", time: "2h ago" },
  { title: "Result exported", time: "4h ago" },
  { title: "User invited to portal", time: "1d ago" },
];

const Dashboard = ({ operationsCount = 0 }) => {
  const { user } = useAuth();

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Welcome back</p>
          <h1 className="dash-title">{user?.email || "Examiner Admin"}</h1>
          <p className="dash-subtitle">Overview of your workspace with quick links to the API console.</p>
        </div>
        <div className="dash-header-tools">
          <Link to="/api-explorer" className="dash-cta">
            Open API Console
          </Link>
        </div>
      </header>

      <section className="dash-metrics">
        {metrics.map((item) => (
          <div key={item.label} className={`dash-metric tone-${item.tone}`}>
            <div className="dash-metric-label">{item.label}</div>
            <div className="dash-metric-value">
              {item.label === "API Operations" ? operationsCount : item.value}
            </div>
          </div>
        ))}
      </section>

      <section className="dash-panels">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Recent Activity</h3>
            <span className="dash-panel-meta">sample data</span>
          </div>
          <ul className="dash-list">
            {recentActivity.map((item) => (
              <li key={item.title}>
                <div className="dash-list-title">{item.title}</div>
                <div className="dash-list-meta">{item.time}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Next Steps</h3>
            <span className="dash-panel-meta">actions</span>
          </div>
          <ul className="dash-list bullets">
            <li>Connect login API and replace the placeholder token logic.</li>
            <li>Point base URL to the deployed backend for live CRUD.</li>
            <li>Invite collaborators to test the API console.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
