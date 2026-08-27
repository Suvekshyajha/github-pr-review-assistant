import StatusBadge from "./StatusBadge";

function formatConnectedDate(dateValue) {
  if (!dateValue) return "Connected recently";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Connected recently";
  }

  const daysAgo = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAgo <= 0) return "Connected today";
  if (daysAgo === 1) return "Connected 1 day ago";

  return `Connected ${daysAgo} days ago`;
}

export default function RepositoryCard({ repository, onClick }) {
  const initial = repository.repo?.charAt(0)?.toUpperCase() || "R";

  const avatarColor =
    repository.id % 3 === 0
      ? "repository-avatar--yellow"
      : repository.id % 2 === 0
        ? "repository-avatar--purple"
        : "repository-avatar--blue";

  return (
    <button className="repository-card" type="button" onClick={onClick}>
      <span className={`repository-avatar ${avatarColor}`}>
        {initial}
      </span>

      <span className="repository-card__info">
        <span className="repository-card__title">
          {repository.owner}/{repository.repo}
        </span>

        <span className="repository-card__meta">
          {formatConnectedDate(repository.connected_at)}
        </span>
      </span>

      <StatusBadge status="active" />

      <span className="repository-card__actions">
        <span>↗</span>
        <span>⋯</span>
      </span>
    </button>
  );
}