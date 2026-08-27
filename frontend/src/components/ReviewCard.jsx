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

export default function ReviewCard({
  review,
  expanded,
  onToggle,
}) {
  const reviewText =
    review.review_text || "No review text available.";

  return (
    <article className="review-card">
      <button
        className="review-card__summary"
        type="button"
        onClick={onToggle}
      >
        <span className="review-card__identity">
          <span className="review-card__dot" />

          <span>
            <strong>
              {review.owner}/{review.repo}
            </strong>

            <b>#{review.pr_number}</b>

            <span className="review-card__title">
              Pull request review
            </span>
          </span>
        </span>

        <span className="review-card__summary-right">
          <span className="review-card__date">
            {formatDate(review.created_at)}
          </span>

          <StatusBadge status={review.status || "completed"} />

          <span className="chevron">
            {expanded ? "⌃" : "›"}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="review-card__details">
          <div className="review-card__body">
            <div className="review-card__section-label">
              <span className="code-icon">&lt;/&gt;</span>
              AGENT REVIEW
            </div>

            <p className="review-card__text">{reviewText}</p>

            <div className="review-card__context">
              <span>CONTEXT USED</span>
              <strong>{getContextCount(review)} files</strong>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}