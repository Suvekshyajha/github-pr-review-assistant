const statuses = {
  active: {
    label: "Active",
    className: "status-badge--active",
    icon: "●",
  },
  completed: {
    label: "Completed",
    className: "status-badge--completed",
    icon: "✓",
  },
  reviewing: {
    label: "Reviewing",
    className: "status-badge--reviewing",
    icon: "◌",
  },
  failed: {
    label: "Failed",
    className: "status-badge--failed",
    icon: "×",
  },
};

export default function StatusBadge({ status = "completed" }) {
  const currentStatus = statuses[status.toLowerCase()] || statuses.completed;

  return (
    <span className={`status-badge ${currentStatus.className}`}>
      <span>{currentStatus.icon}</span>
      {currentStatus.label}
    </span>
  );
}