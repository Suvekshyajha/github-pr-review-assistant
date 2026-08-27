import { NavLink } from "react-router-dom";

function NavigationIcon({ type }) {
  if (type === "repository") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M6 4.5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
        <path d="M8 9h8M8 13h8M8 17h4" />
      </svg>
    );
  }

  if (type === "activity") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 13h4l2.5-6 3.2 10 2.2-6H21" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 8a8 8 0 1 1-.5 8.8" />
      <path d="M5 4v4h4M12 8v4l3 2" />
    </svg>
  );
}

const navigationItems = [
  {
    label: "Connect",
    description: "Repositories",
    path: "/",
    icon: "repository",
    end: true,
  },
  {
    label: "Live Activity",
    description: "Current reviews",
    path: "/live-activity",
    icon: "activity",
  },
  {
    label: "History",
    description: "Review archive",
    path: "/history",
    icon: "history",
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__logo">⑂</div>

        <div className="brand__text">
          <strong>PR Review Agent</strong>
          <span>PRIVATE BETA</span>
        </div>

        <button
          className="brand__settings"
          type="button"
          aria-label="Settings"
        >
          ⋯
        </button>
      </div>

      <nav className="sidebar__nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__link ${
                isActive ? "sidebar__link--active" : ""
              }`
            }
          >
            <span className="sidebar__icon">
              <NavigationIcon type={item.icon} />
            </span>

            <span className="sidebar__link-text">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="workspace-status">
        <div className="workspace-status__title">
          <span className="online-dot" />
          WORKSPACE ONLINE
        </div>

        <p>Reviews stay local in this prototype.</p>
        <small>Nothing leaves this workspace.</small>
      </div>
    </aside>
  );
}