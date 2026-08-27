import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { listReviews } from "../api/reviews";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await listReviews();
      setReviews(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.toLowerCase().trim();

    return reviews.filter((review) => {
      const status = review.status || "completed";

      const matchesFilter =
        filter === "all" || status === filter;

      const searchableText = [
        review.owner,
        review.repo,
        review.pr_number,
        review.review_text,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [reviews, search, filter]);

  return (
    <section className="page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-icon">◷</span>
          ARCHIVE
        </div>

        <h1>Review History</h1>
        <p>
          A durable trail of decisions, findings, and the code behind them.
        </p>
      </div>

      <div className="history-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search repositories or pull requests"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {["all", "completed", "failed"].map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "filter-tab--active" : ""}
              onClick={() => setFilter(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="history-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading review history...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state">No reviews found.</div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>REPOSITORY</th>
                <th>PR #</th>
                <th>PR TITLE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>
                      {review.owner}/{review.repo}
                    </strong>
                  </td>

                  <td>#{review.pr_number}</td>
                  <td>Pull request review</td>

                  <td>
                    <StatusBadge status={review.status || "completed"} />
                  </td>

                  <td>{formatDate(review.created_at)}</td>
                  <td className="history-table__arrow">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}