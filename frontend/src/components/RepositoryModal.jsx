import StatusBadge from "./StatusBadge";

function formatDate(dateValue) {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getContextCount(review) {
  if (review.context_chunks_json) {
    try {
      const parsed = JSON.parse(review.context_chunks_json);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  return 0;
}

export default function RepositoryModal({
  repository,
  reviews,
  onClose,
  onOpenActivity,
}) {
  if (!repository) return null;

  const repositoryReviews = reviews.filter(
    (review) =>
      review.owner === repository.owner &&
      review.repo === repository.repo
  );

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="repository-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="repository-modal__header">
          <div className="repository-modal__identity">
            <span className="repository-avatar repository-avatar--blue">
              {repository.repo?.charAt(0)?.toUpperCase() || "R"}
            </span>

            <div>
              <div className="repository-modal__title">
                {repository.owner}/{repository.repo}
                <StatusBadge status="active" />
              </div>

              <p>
                Connected recently <span>•</span> Webhook healthy
              </p>
            </div>
          </div>

          <button
            className="modal-close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="repository-stats">
          <div>
            <span>REVIEWS</span>
            <strong>{repositoryReviews.length}</strong>
          </div>

          <div>
            <span>LAST REVIEW</span>
            <strong>
              {repositoryReviews.length
                ? formatDate(repositoryReviews[0].created_at)
                : "No reviews"}
            </strong>
          </div>

          <div>
            <span>DEFAULT BRANCH</span>
            <strong className="branch-name">main</strong>
          </div>
        </div>

        <div className="repository-modal__body">
          <div className="modal-section-heading">
            <div>
              <h3>Recent reviews</h3>
              <p>A quick look at this repository&apos;s review trail.</p>
            </div>

            <button
              className="outline-button"
              type="button"
              onClick={onOpenActivity}
            >
              Open activity ↗
            </button>
          </div>

          <div className="recent-review-list">
            {repositoryReviews.length === 0 ? (
              <div className="empty-state empty-state--small">
                No reviews for this repository yet.
              </div>
            ) : (
              repositoryReviews.slice(0, 3).map((review) => (
                <div className="recent-review" key={review.id}>
                  <span className="review-status-dot" />

                  <div className="recent-review__content">
                    <strong>
                      #{review.pr_number} — Pull request review
                    </strong>

                    <span>
                      {formatDate(review.created_at)} ·{" "}
                      {getContextCount(review)} context files
                    </span>
                  </div>

                  <StatusBadge
                    status={review.status || "completed"}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="repository-modal__footer">
          <a
            href={`https://github.com/${repository.owner}/${repository.repo}`}
            target="_blank"
            rel="noreferrer"
          >
            Open on GitHub ↗
          </a>

          <button
            className="primary-button"
            type="button"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}