System Architecture

1. Overview

The GitHub PR Review Assistant is a context-aware pull request review system.

The main architectural idea is:

Do not review a pull request from the diff alone. First understand the repository, retrieve the most relevant existing code, and then use that context together with the PR changes to generate the review.

The system is divided into five main areas:

GitHub integration — repository, pull request, authentication, and webhook operations

Indexing & retrieval — converts repository code into searchable context

LangGraph workflow — orchestrates the review process

LLM review layer — generates the actual review using Groq

API & React frontend — exposes the system to the user

2. High-Level Architecture

                         ┌──────────────────────┐
                         │      GitHub          │
                         │                      │
                         │ Repository / PR      │
                         │ Pull Request Webhook │
                         └──────────┬───────────┘
                                    │
                         GitHub API / Webhook
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │       API Layer      │
                         │                      │
                         │ /review              │
                         │ /repos               │
                         │ /history             │
                         │ /webhook             │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    LangGraph         │
                         │   Review Workflow    │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │ GitHub Layer │      │  Retrieval   │      │  LLM Layer   │
      │              │      │    Layer     │      │              │
      │ diff / repo  │      │ ChromaDB     │      │ Groq         │
      │ / comments   │      │ + BM25       │      │ reviewer.py  │
      └──────────────┘      └──────────────┘      └──────────────┘
                                    │
                                    ▼
                         Relevant repository
                              context
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Generated Review   │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                 SQLite / History       GitHub PR Comment
                         ▲
                         │
                  React Frontend

3. Repository Indexing Architecture

Repository indexing happens before context-aware review.

GitHub Repository
       │
       ▼
get_repo_tree()
       │
       ▼
Filter relevant source files
       │
       ▼
Fetch file contents
       │
       ▼
Code-aware splitting
       │
       ▼
┌──────┴─────────┐
│                │
▼                ▼
Embeddings      BM25
│                │
▼                ▼
ChromaDB       BM25 Index
│                │
└──────┬─────────┘
       ▼
 HybridRetriever

GitHub Repository Fetching

The github/ package communicates with GitHub.

github/
├── auth.py
├── repo.py
├── pull_request.py
└── webhooks.py

Responsibilities:

Authenticate with GitHub

Retrieve the repository tree

Retrieve repository file contents

Retrieve pull request diffs

Work with pull request comments

Handle webhook-related GitHub operations

repo.py filters the repository tree so that irrelevant files and directories are not unnecessarily indexed.

4. Code Chunking

Repository source files are split into smaller chunks before indexing.

Source File
    │
    ▼
Code-aware splitter
    │
    ├── Python
    │
    └── JavaScript / TypeScript
    │
    ▼
Code Chunks

The purpose of chunking is to avoid treating an entire source file as a single retrieval document.

The indexing layer is located in:

indexing/
├── splitter.py
├── loader.py
├── embeddings.py
├── vectordb.py
├── bm25.py
└── retriever.py

5. Hybrid Retrieval

The system uses two complementary retrieval approaches.

Semantic Retrieval

Code chunks are converted into embeddings using sentence-transformers.

Code Chunk
    │
    ▼
Embedding Model
    │
    ▼
Vector
    │
    ▼
ChromaDB

This helps find code that is conceptually related even when the exact words do not match.

Keyword Retrieval

BM25 provides keyword-based retrieval.

Repository Chunks
       │
       ▼
BM25 Index
       │
       ▼
Keyword / Identifier Matches

This is useful for exact:

Function names

Variables

Classes

Identifiers

Terms appearing in the PR

Combined Retrieval

indexing/retriever.py combines both approaches through HybridRetriever.

PR Diff / Search Query
          │
     ┌────┴────┐
     ▼         ▼
 ChromaDB     BM25
 Vector       Keyword
 Search       Search
     │         │
     └────┬────┘
          ▼
   HybridRetriever
          │
          ▼
Relevant Code Context

The goal is to provide the LLM with repository context that is both semantically relevant and keyword-relevant.

6. LangGraph Review Workflow

The review workflow is implemented using LangGraph.

                    ┌────────────────┐
                    │     START      │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │   fetch_diff   │
                    └───────┬────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   retrieve_context   │
                 └──────────┬───────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │    review_pr    │
                    └───────┬────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ should_post_comment  │
                 └──────────┬───────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
              review exists         no review
                 │                     │
                 ▼                     ▼
        ┌────────────────┐           END
        │  post_comment  │
        └───────┬────────┘
                │
                ▼
               END

Graph Components

graph/
├── graph.py
├── nodes.py
├── router.py
└── state.py

state.py

Defines the shared PRReviewState passed between workflow steps.

The state contains information required throughout the review process, including the repository, PR information, diff, retrieved context, and generated review.

nodes.py

Contains the workflow operations:

fetch_diff

retrieve_context

review_pr

post_comment

Each node has a focused responsibility.

router.py

Contains the conditional decision used after the review step.

It determines whether the generated review should proceed to the GitHub comment step or finish the graph.

graph.py

Builds and compiles the LangGraph StateGraph.

The graph is wired as:

fetch_diff
    ↓
retrieve_context
    ↓
review_pr
    ↓
conditional router
    ├── post_comment → END
    └── END

7. LLM Review Layer

The LLM-related logic is kept in:

llm/
└── reviewer.py

The reviewer receives two important inputs:

Pull Request Diff
       +
Relevant Repository Context
       │
       ▼
     Groq LLM
       │
       ▼
Generated Code Review

The review focuses on issues such as:

Bugs or errors

Improvements

Cross-file impact

Repository conventions

The repository context is important because a changed line may only make sense when compared with related code elsewhere in the project.

8. FastAPI Backend

The backend exposes the review system through FastAPI.

api/
├── __init__.py
├── main.py
├── db.py
└── routes/

The API layer connects the React frontend, GitHub integration, database, and LangGraph workflow.

Main API Responsibilities

Frontend
   │
   ├── Repository operations
   │
   ├── Manual review
   │
   └── Review history
   │
   ▼
FastAPI
   │
   ├── /repos
   ├── /review
   ├── /history
   └── /webhook

Manual Review

React Frontend
      │
      │ POST /review
      ▼
   FastAPI
      │
      ▼
 LangGraph
      │
      ▼
 Review Generated
      │
      ├──────────────► SQLite
      │
      └──────────────► GitHub PR

9. Webhook Automation

The webhook path allows GitHub to trigger the same review process automatically.

Developer opens PR
       │
       ▼
GitHub
       │
       │ POST /webhook
       ▼
FastAPI Webhook Route
       │
       ▼
Check event action
       │
       └── action == "opened"
                    │
                    ▼
             Background Task
                    │
                    ▼
              Review Workflow
                    │
                    ▼
               Save Review
                    │
                    ▼
             GitHub PR Comment

The webhook route is intended to respond quickly to GitHub and run the longer review operation as a background task.

For local development, GitHub cannot directly reach localhost; a public tunnel such as ngrok is required when testing real GitHub webhook delivery locally.

10. Repository Connection Flow

Connected repositories are managed through the API.

React Frontend
      │
      │ POST /repos/connect
      ▼
   FastAPI
      │
      ▼
 GitHub API
      │
      ├── Create repository webhook
      │
      ▼
 Save connected repository
      │
      ▼
    SQLite

Disconnecting follows the reverse process:

DELETE repository
      │
      ▼
FastAPI
      │
      ▼
Delete GitHub webhook
      │
      ▼
Remove repository from SQLite

11. Database / History Layer

The project uses SQLite for local persistence.

api/db.py
    │
    ├── reviews
    │
    └── connected_repos

The review history stores information associated with completed reviews, including repository and PR information, review text, retrieved context, status, and creation time.

Connected repositories store information needed to manage repository connections and webhooks.

The database is local application data and should not be committed to source control.

12. React Frontend Architecture

The current frontend is organized as:

frontend/
└── src/
    ├── api/
    │   ├── client.js
    │   ├── repositories.js
    │   └── reviews.js
    │
    ├── components/
    │   ├── Header.jsx
    │   ├── RepositoryCard.jsx
    │   ├── RepositoryModal.jsx
    │   ├── ReviewCard.jsx
    │   ├── Sidebar.jsx
    │   └── StatusBadge.jsx
    │
    ├── pages/
    │   ├── HistoryPage.jsx
    │   ├── HomePage.jsx
    │   └── LiveActivityPage.jsx
    │
    ├── App.jsx
    ├── main.jsx
    └── styles.css

Frontend Layers

Pages
  │
  ▼
Reusable Components
  │
  ▼
API Modules
  │
  ▼
FastAPI Backend

The API modules keep HTTP communication separate from the React UI.

13. Frontend-to-Backend Flow

The intended application flow is:

┌─────────────────────┐
│   React Frontend    │
│                     │
│ HomePage            │
│ LiveActivityPage    │
│ HistoryPage         │
└──────────┬──────────┘
           │
           │ HTTP
           ▼
┌─────────────────────┐
│      FastAPI        │
│                     │
│ /repos              │
│ /review             │
│ /history            │
│ /webhook            │
└──────────┬──────────┘
           │
     ┌─────┼─────────────┐
     ▼     ▼             ▼
  GitHub  Graph        SQLite
           │
           ▼
       Retriever
           │
      ┌────┴────┐
      ▼         ▼
   ChromaDB    BM25
      │         │
      └────┬────┘
           ▼
        Groq LLM

14. End-to-End Manual Review

A manual review follows this path:

User
 │
 ▼
React UI
 │
 │ repository + PR number
 ▼
POST /review
 │
 ▼
FastAPI
 │
 ▼
LangGraph
 │
 ├── Fetch PR diff
 │
 ├── Retrieve relevant repository context
 │      │
 │      ├── ChromaDB
 │      └── BM25
 │
 ├── Generate review with Groq
 │
 └── Post review to GitHub
 │
 ▼
Save review history
 │
 ▼
React displays result

15. End-to-End Automatic Review

For webhook-triggered reviews:

GitHub Pull Request
        │
        │ pull_request webhook
        ▼
POST /webhook
        │
        ▼
Validate event
        │
        ▼
Background review task
        │
        ▼
Fetch PR diff
        │
        ▼
Retrieve repository context
        │
        ▼
Generate review
        │
        ▼
Save history
        │
        ▼
Post GitHub comment

There is no frontend view directly triggering the webhook. GitHub is the source of the webhook event.

16. Separation of Responsibilities

The project separates responsibilities so that each major part can be developed and tested independently.

github/
    GitHub communication

indexing/
    Repository → searchable context

graph/
    Review workflow orchestration

llm/
    Review generation

api/
    HTTP interface + persistence

frontend/
    User interface

tests/
    Verification

utils/
    Shared infrastructure

This makes it possible to replace or improve one layer without rewriting the entire application.

17. Error and Configuration Boundary

Secrets are kept outside the source code through environment variables.

.env
 │
 ├── GITHUB_TOKEN
 │
 └── GROQ_API_KEY
       │
       ▼
utils/config.py
       │
       ▼
Application Components

The real .env file should remain local and should be excluded through .gitignore.

18. Current Architecture Status

Based on the project's development journal, the backend/API portion has been developed through the API logic, while frontend-to-backend integration and final frontend implementation/testing remain areas of ongoing work.

Implemented architectural pieces include:

GitHub authentication and repository operations

Repository indexing

Code-aware chunking

Embeddings

ChromaDB vector storage

BM25 retrieval

Hybrid retrieval

LangGraph review workflow

Groq LLM integration

PR diff retrieval

GitHub PR comment functionality

FastAPI API structure

SQLite review/history layer

Webhook endpoint structure

React frontend structure

The architecture is therefore designed for an end-to-end flow, while the final state of frontend/API wiring and production deployment should be treated as work in progress.

19. Core Design Principle

The central architecture can be summarized as:

Repository Understanding
          +
Pull Request Changes
          ↓
    Hybrid Retrieval
          ↓
 Relevant Code Context
          +
       PR Diff
          ↓
      Groq LLM
          ↓
    Context-Aware
      PR Review
          ↓
 GitHub Comment + History

The important distinction from a basic diff-based reviewer is that the system retrieves existing repository context before asking the LLM to review the pull request.
