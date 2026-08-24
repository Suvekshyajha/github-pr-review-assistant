github-pr-review-assistant/
├── .venv/
├── chroma_db/
├── data.db
├── .env
├── .gitignore
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── README.md
│
├── github/
│   ├── __init__.py
│   ├── auth.py
│   ├── repo.py
│   └── pull_request.py
│
├── indexing/
│   ├── __init__.py
│   ├── splitter.py
│   ├── embeddings.py
│   ├── vectordb.py
│   ├── bm25.py
│   ├── retriever.py
│   └── loader.py
│
├── graph/
│   ├── __init__.py
│   ├── state.py
│   ├── nodes.py
│   ├── router.py
│   └── graph.py
│
├── llm/
│   ├── __init__.py
│   └── reviewer.py
│
├── utils/
│   ├── __init__.py
│   ├── config.py
│   └── logger.py
│
├── tests/
│   ├── __init__.py
│   ├── test_github.py
│   ├── test_indexing.py
│   └── test_graph.py
│
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── db.py
│   ├── models.py
│   └── routes/
│       ├── __init__.py
│       ├── review.py
│       ├── webhook.py
│       ├── repos.py
│       └── history.py
│
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── public/
    │   └── favicon.svg
    │
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── TopBar.tsx
        │   │   └── Navigation.tsx
        │   │
        │   ├── repositories/
        │   │   ├── ConnectRepositoryForm.tsx
        │   │   ├── ConnectedRepositoryList.tsx
        │   │   ├── RepositoryCard.tsx
        │   │   ├── RepositoryDetails.tsx
        │   │   └── DisconnectRepositoryDialog.tsx
        │   │
        │   ├── reviews/
        │   │   ├── ManualReviewForm.tsx
        │   │   ├── ReviewActivityFeed.tsx
        │   │   ├── ReviewCard.tsx
        │   │   ├── ReviewDetails.tsx
        │   │   ├── ReviewStatusBadge.tsx
        │   │   └── ContextUsed.tsx
        │   │
        │   ├── history/
        │   │   ├── HistoryFilters.tsx
        │   │   ├── HistoryTable.tsx
        │   │   └── HistoryRow.tsx
        │   │
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Input.tsx
        │       ├── Badge.tsx
        │       ├── Modal.tsx
        │       ├── Spinner.tsx
        │       ├── EmptyState.tsx
        │       └── ErrorMessage.tsx
        │
        ├── views/
        │   ├── ConnectView.tsx
        │   ├── LiveActivityView.tsx
        │   └── HistoryView.tsx
        │
        ├── api/
        │   ├── client.ts
        │   ├── repositories.ts
        │   ├── reviews.ts
        │   └── history.ts
        │
        ├── hooks/
        │   ├── useRepositories.ts
        │   ├── useReviews.ts
        │   ├── useHistory.ts
        │   └── useReviewStatus.ts
        │
        ├── types/
        │   ├── repository.ts
        │   ├── review.ts
        │   └── history.ts
        │
        └── lib/
            ├── formatDate.ts
            ├── formatRelativeTime.ts
            └── utils.ts

---
Frontend-to-backend mapping:

ConnectView
└── src/api/repositories.ts
    ├── GET    /repos
    ├── POST   /repos
    └── DELETE /repos/{owner}/{repo}

LiveActivityView
└── src/api/reviews.ts
    ├── POST /review
    └── GET  /history

HistoryView
└── src/api/history.ts
    ├── GET /history
    └── GET /history/{id}

Webhook automation (no frontend view — triggered by GitHub, not the UI)
└── api/routes/webhook.py
    └── POST /webhook   (GitHub PR "opened" event -> background task -> saves to history)
