# 🔍 GitHub PR Review Assistant

A context-aware pull request review agent that indexes an entire GitHub repository first — like a new developer getting familiar with the codebase — then reviews PR diffs with that full context in mind, catching cross-file impact and convention mismatches that a plain diff-only review would miss.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-latest-1C3C3C?style=flat)
![ChromaDB](https://img.shields.io/badge/ChromaDB-embedded-orange?style=flat)
![Groq](https://img.shields.io/badge/openai/gpt-oss-120b-Groq-F55036?style=flat)


<img width="1918" height="857" alt="Screenshot 2026-08-27 224028" src="https://github.com/user-attachments/assets/9816c885-5967-46c9-8f66-7d892e9b180b" />



## 📌 Project Scope

| Property | Detail |
|---|---|
| Input | GitHub repository + PR number |
| Output | Structured plain-text review posted as a GitHub PR comment |
| Retrieval | Hybrid search — ChromaDB (vector) + BM25 (keyword) |
| Orchestration | LangGraph agent pipeline |
| LLM | LLaMA 3 70B via Groq API (free tier) |
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI + SQLite |

---

## ✨ Features

- **Full repo indexing** — fetches every code file in a repo, chunks it intelligently by language, and embeds it for retrieval
- **Hybrid search** — combines ChromaDB vector search (semantic) and BM25 keyword search for best-of-both retrieval
- **LangGraph pipeline** — structured agent: fetch diff → retrieve context → LLM review → post comment
- **Four-part review** — catches bugs/errors, suggests improvements, detects cross-file impact, flags convention mismatches
- **Auto GitHub comment** — posts the review directly on the PR as a comment
- **Webhook automation** — connect any repo and reviews trigger automatically when a PR is opened
- **Per-repo isolation** — each connected repo gets its own ChromaDB collection so embeddings never mix
- **Review history** — all reviews saved to SQLite, browsable in the frontend
- **Manual trigger** — submit any PR for review on demand via the UI
- **Free stack** — GitHub API + sentence-transformers + ChromaDB + rank_bm25 + Groq, no paid services required

---

## 🏗️ Project Structure

```text
github-pr-review-assistant/
│
├── api/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── review.py             # POST /review — manual trigger
│   │   ├── webhook.py            # POST /webhook — GitHub event receiver
│   │   ├── repos.py              # connect/disconnect/list repos
│   │   └── history.py            # GET /history, GET /history/{id}
│   ├── __init__.py
│   ├── db.py                     # SQLite connection + table setup
│   ├── graph_registry.py         # per-repo graph cache (lazy indexing)
│   └── main.py                   # FastAPI app entry point
│
├── docs/
│   ├── screenshots/              # ← screenshots go here
│   └── architecture.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── repositories.js
│   │   │   └── reviews.js
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── RepositoryCard.jsx
│   │   │   ├── RepositoryModal.jsx
│   │   │   ├── ReviewCard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   └── LiveActivityPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── github/
│   ├── __init__.py
│   ├── auth.py                   # GitHub API auth + repo tree fetching
│   ├── pull_request.py           # fetch PR diff + post comment
│   ├── repo.py                   # filter code files from tree
│   └── webhooks.py               # create/delete GitHub webhooks
│
├── graph/
│   ├── graph.py                  # LangGraph wiring
│   ├── nodes.py                  # fetch_diff, retrieve_context, review_pr, post_comment
│   ├── router.py                 # conditional edge logic
│   └── state.py                  # PRReviewState schema
│
├── indexing/
│   ├── bm25.py                   # BM25 keyword index + query
│   ├── embeddings.py             # embed chunks into ChromaDB
│   ├── loader.py                 # orchestrate full index pipeline
│   ├── retriever.py              # hybrid search (vector + BM25)
│   ├── splitter.py               # language-aware code chunking
│   └── vectordb.py               # ChromaDB store + query
│
├── llm/
│   └── reviewer.py               # Groq client + prompt + LLM call
│
├── tests/
│   ├── test_github.py
│   ├── test_graph.py
│   ├── test_indexing.py
│   ├── test_retriever.py
│   └── test_reviewer.py
│
├── utils/
│   ├── cache.py
│   ├── config.py                 # env var loading (GITHUB_TOKEN, GROQ_API_KEY)
│   ├── helpers.py
│   └── logger.py
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Wouter, TanStack Query |
| Backend | FastAPI, Uvicorn |
| Orchestration | LangGraph |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace) |
| Vector DB | ChromaDB (embedded, per-repo collections) |
| Keyword Search | rank-bm25 |
| LLM | LLaMA 3 70B via Groq API |
| Database | SQLite (review history + connected repos) |
| GitHub Integration | GitHub REST API v3 |

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.11+
- Node.js LTS
- A GitHub Personal Access Token (with `repo` scope)
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone and set up Python environment

```bash
git clone https://github.com/Suvekshyajha/github-pr-review-assistant.git
cd github-pr-review-assistant
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 2. Add your API keys

Create a `.env` file in the project root:

```env
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_key_here
WEBHOOK_BASE_URL=https://your-app.onrender.com   # update after deploy
```

### 3. Run the backend

```bash
uvicorn api.main:app --reload
```

Runs on: `http://localhost:8000`

The server starts immediately — repos are indexed lazily on first review request, not at startup.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: `http://localhost:5173`

---
## 🐳 Docker

The application can be run using Docker Compose with separate containers for the
FastAPI backend and React frontend.

### Docker Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   React + Vite       │
                    │      + Nginx         │
                    │      Port 80         │
                    └──────────┬───────────┘
                               │
                         /api/ requests
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │ FastAPI + Uvicorn    │
                    │      Port 8000       │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
              ┌───────────┐          ┌───────────┐
              │ ChromaDB  │          │  SQLite   │
              │  storage  │          │  reviews  │
              └───────────┘          └───────────┘
--
## 📸 Screenshots




Home page/Connect a Repo:
<img width="1918" height="857" alt="Screenshot 2026-08-27 224028" src="https://github.com/user-attachments/assets/01d0082c-e4da-46f1-8fa5-378fe12e60ef" />
Live history:
<img width="1918" height="852" alt="Screenshot 2026-08-27 224056" src="https://github.com/user-attachments/assets/1c9aefed-ee96-456d-a834-fb9fa8e4056c" />
Review History:
<img width="1912" height="860" alt="Screenshot 2026-08-27 224104" src="https://github.com/user-attachments/assets/f503bd31-725f-4c85-9337-2fa397357071" />



---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/review` | Trigger a manual PR review |
| GET | `/history` | List all past reviews |
| GET | `/history/{id}` | Get one review in detail |
| POST | `/webhook` | GitHub webhook receiver (PR opened event) |
| POST | `/repos/connect` | Connect a repo + register GitHub webhook |
| GET | `/repos` | List connected repos |
| DELETE | `/repos/{id}` | Disconnect a repo + delete its webhook |

---

## 🧠 How It Works

```
User connects a repo
       ↓
PR is opened (webhook) or submitted manually (UI)
       ↓
graph_registry checks if repo is already indexed
   ├── Yes → reuse existing graph
   └── No  → fetch tree → filter code files → chunk → embed into ChromaDB → build BM25 index
       ↓
fetch_diff node — pulls the raw unified diff from GitHub API
       ↓
retrieve_context node — hybrid search over indexed codebase
   ├── ChromaDB vector search  (semantic similarity)
   └── BM25 keyword search     (exact token matching)
       ↓ top 5 merged, deduplicated results
review_pr node — LLaMA 3 70B reviews diff + context chunks
   checks: bugs, improvements, cross-file impact, convention mismatches
       ↓
post_comment node — posts review as a GitHub PR comment
       ↓
save to SQLite → visible in history UI
```

---

## 📁 Data Flow

```
GitHub repo tree  →  filter_code_files()  →  chunk_code()  →  ChromaDB + BM25 index
PR diff           →  hybrid retrieval     →  LLM prompt    →  review text
review text       →  GitHub PR comment    +  SQLite DB      →  frontend history
```

---

## 🔍 Why Hybrid Search

| Method | Good at | Bad at |
|---|---|---|
| ChromaDB (vector) | Semantic similarity — "where is auth handled" | Exact token matches |
| BM25 (keyword) | Exact matches — function names, variable names | Synonyms, concepts |
| **Hybrid** | **Both** | — |

Code is full of exact tokens (function names, import paths, variable names) that pure semantic search can miss. BM25 catches those; vector search catches semantic patterns. Combined, they retrieve the most relevant existing code context for any given diff.

---

## ⚙️ Configuration

| Variable | Location | Description |
|---|---|---|
| `GITHUB_TOKEN` | `.env` | GitHub Personal Access Token (`repo` scope required) |
| `GROQ_API_KEY` | `.env` | Groq API key for LLaMA 3 70B |
| `WEBHOOK_BASE_URL` | `.env` | Public URL for webhook registration (set after deploy) |
| `collection_name` | `api/graph_registry.py` | Per-repo ChromaDB collection naming |
| `chunk_size` | `indexing/splitter.py` | Characters per chunk (default: 500) |
| `chunk_overlap` | `indexing/splitter.py` | Overlap between chunks (default: 50) |
| `model` | `llm/reviewer.py` | LLM model (default: `llama3-70b-8192`) |




## ⚠️ Important Notes

- `node_modules/`, `.next/`, and `chroma_db/` are git-ignored — run `npm install` after cloning and the ChromaDB index rebuilds on first use
- `.env` is git-ignored — never commit API keys
- Add `~$*` to `.gitignore` to prevent accidental Office temp file commits
- BM25 index lives in memory and rebuilds each server start — this is intentional for simplicity; ChromaDB persists to disk
- The GitHub token needs `repo` scope for both PR comment posting and webhook creation
- For local webhook testing, use [ngrok](https://ngrok.com) to expose `localhost:8000` publicly; on Render, the public URL works directly

---

## Known Limitations & Future Improvements

- **Synchronous first-time indexing**: When a repository is reviewed for the first time, 
  the system indexes it (fetching, chunking, and embedding the codebase) synchronously 
  before generating the review. For small repositories this completes in a few seconds; 
  for large repositories, the first review request will be noticeably slower while the 
  user waits on that single call. Subsequent reviews on the same repository reuse the 
  cached index and run at normal speed.

  **Planned improvement**: trigger indexing as a background task at the moment a 
  repository is connected (via `/repos/connect`), rather than lazily on the first 
  review request — so indexing overhead is absorbed upfront rather than surfaced to 
  the user during their first PR review.

- **In-memory graph registry**: Compiled LangGraph instances and their retrievers are 
  currently cached in a Python dictionary in server memory. This means the cache is 
  lost on server restart, requiring re-indexing after every deploy or crash.

  **Planned improvement**: persist indexing state to disk/database so re-indexing is 
  only needed when repository content actually changes, not on every server restart.

- **Ephemeral storage on free-tier hosting**: When deployed on Render's free tier, 
  local storage (ChromaDB files, SQLite review history) is wiped on redeploy, since 
  the free tier does not provide persistent disk.

  **Planned improvement**: migrate to a hosted vector database and Postgres (e.g. via 
  Supabase or Neon's free tiers) for true persistence across deploys.
