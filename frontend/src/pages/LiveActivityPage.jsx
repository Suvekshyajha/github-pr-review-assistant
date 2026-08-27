import { useEffect, useState } from "react";
import ReviewCard from "../components/ReviewCard";
import { listReviews, runReview } from "../api/reviews";

export default function LiveActivityPage() {
  const [reviews, setReviews] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [prNumber, setPrNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadReviews() {
    try {
      setLoading(true);
      const data = await listReviews();
      setReviews(data || []);

      if (data?.length > 0 && expandedId === null) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();

    const interval = setInterval(loadReviews, 10000);

    return () => clearInterval(interval);
  }, []);

  async function handleRunReview(event) {
    event.preventDefault();

    if (!owner || !repo || !prNumber) {
      setError("Enter owner, repository, and pull request number.");
      return;
    }

    try {
      setRunning(true);
      setError("");
      setMessage("");

      await runReview({
        owner,
        repo,
        pr_number: Number(prNumber),
      });

      setMessage(`Review completed for PR #${prNumber}.`);
      setPrNumber("");

      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="page">
      <div className="page-heading page-heading--with-action">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-icon">⌁</span>
            COMMAND STREAM
          </div>

          <h1>Live Activity</h1>
          <p>Watch reviews as they move from diff to decision.</p>
        </div>

        <button className="outline-button" type="button" onClick={loadReviews}>
          ↻ Refresh
        </button>
      </div>

      <div className="manual-review-panel">
        <div className="manual-review-panel__title">
          <span>＋</span>
          Run a review manually
        </div>

        <form className="manual-review-form" onSubmit={handleRunReview}>
          <input
            placeholder="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />

          <input
            placeholder="repository"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
          />

          <input
            className="manual-review-form__number"
            type="number"
            min="1"
            placeholder="PR #"
            value={prNumber}
            onChange={(event) => setPrNumber(event.target.value)}
          />

          <button className="primary-button" type="submit" disabled={running}>
            {running ? "Running..." : "⚑ Run Review Now"}
          </button>
        </form>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="activity-list">
        {loading ? (
          <div className="loading-state">Loading review activity...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            No review activity yet.
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              expanded={expandedId === review.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === review.id ? null : review.id
                )
              }
            />
          ))
        )}
      </div>
    </section>
  );
}