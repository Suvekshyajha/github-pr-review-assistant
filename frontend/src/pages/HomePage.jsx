import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RepositoryCard from "../components/RepositoryCard";
import RepositoryModal from "../components/RepositoryModal";
import {
  connectRepository,
  listRepositories,
} from "../api/repositories";
import { listReviews } from "../api/reviews";

export default function HomePage() {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);

  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [repositoryData, reviewData] = await Promise.all([
        listRepositories(),
        listReviews(),
      ]);

      setRepositories(repositoryData || []);
      setReviews(reviewData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleConnect(event) {
    event.preventDefault();

    if (!owner.trim() || !repo.trim()) {
      setError("Please enter both owner and repository name.");
      return;
    }

    try {
      setConnecting(true);
      setError("");
      setMessage("");

      await connectRepository({
        owner: owner.trim(),
        repo: repo.trim(),
      });

      setOwner("");
      setRepo("");
      setMessage("Repository connected successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-icon">⚑</span>
          REPOSITORY ACCESS
        </div>

        <h1>Connect a Repository</h1>

        <p>
          Give the agent a focused place to look. Connect repositories
          individually so review context stays intentional.
        </p>
      </div>

      <div className="connect-panel">
        <div className="connect-panel__title">
          <span className="panel-icon">⚑</span>
          <strong>Add from GitHub</strong>
        </div>

        <form className="connect-form" onSubmit={handleConnect}>
          <input
            type="text"
            placeholder="owner (e.g. octocat)"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />

          <input
            type="text"
            placeholder="repository (e.g. Hello-World)"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
          />

          <button
            className="primary-button"
            type="submit"
            disabled={connecting}
          >
            ＋ {connecting ? "Connecting..." : "Connect Repo"}
          </button>
        </form>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="section-heading">
        <h2>
          Connected repositories{" "}
          <span className="section-count">{repositories.length}</span>
        </h2>

        <button
          className="text-button"
          type="button"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      <div className="repository-list">
        {loading ? (
          <div className="loading-state">Loading repositories...</div>
        ) : repositories.length === 0 ? (
          <div className="empty-state">
            No repositories connected yet.
          </div>
        ) : (
          repositories.map((repository) => (
            <RepositoryCard
              key={repository.id}
              repository={repository}
              onClick={() => setSelectedRepository(repository)}
            />
          ))
        )}
      </div>

      {selectedRepository && (
        <RepositoryModal
          repository={selectedRepository}
          reviews={reviews}
          onClose={() => setSelectedRepository(null)}
          onOpenActivity={() => {
            setSelectedRepository(null);
            navigate("/live-activity");
          }}
        />
      )}
    </section>
  );
}