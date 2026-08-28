<img width="109" height="150" alt="github_pr_review_pipeline" src="https://github.com/user-attachments/assets/b736354b-c8e6-4c24-b537-5c8cee32ccbc" />System Architecture

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
Basically the architecture can be summarized by this image in brief:
![Uploading github_<svg width="100%" viewBox="0 0 680 940" role="img" style="" xmlns="http://www.w3.org/2000/svg">
<title style="fill:rgb(0, 0, 0);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">GitHub PR review assistant architecture</title>
<desc style="fill:rgb(0, 0, 0);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">Pipeline diagram: a pull request triggers diff fetch, hybrid context retrieval (ChromaDB semantic search plus BM25 keyword search), merged context feeds an LLM review step, then a routing decision posts the review as a GitHub comment and saves it to history.</desc>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
<mask id="imagine-text-gaps-wtiow3" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="680" height="940" fill="white"/><rect x="214.7339630126953" y="21.461536407470703" width="251.50784301757812" height="30.666664123535156" fill="black" rx="2"/><rect x="231.6890869140625" y="52.71794509887695" width="216.6217803955078" height="18.358973503112793" fill="black" rx="2"/><rect x="313.33172607421875" y="106.76922607421875" width="53.3365364074707" height="15.282051086425781" fill="black" rx="2"/><rect x="276.9294738769531" y="121.64102172851562" width="126.50904846191406" height="21.435895919799805" fill="black" rx="2"/><rect x="517.9759521484375" y="185.79486083984375" width="78.49553680419922" height="14.256409645080566" fill="black" rx="2"/><rect x="75.99999237060547" y="184.7179412841797" width="135.3557586669922" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="199.64102172851562" width="243.6046142578125" height="21.435895919799805" fill="black" rx="2"/><rect x="75.99999237060547" y="218.7179412841797" width="209.37818908691406" height="18.358973503112793" fill="black" rx="2"/><rect x="524.9791259765625" y="275.79486083984375" width="64.48825454711914" height="14.256409645080566" fill="black" rx="2"/><rect x="75.99999237060547" y="274.71795654296875" width="213.38426208496094" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="289.6410217285156" width="238.16046142578125" height="21.435895919799805" fill="black" rx="2"/><rect x="75.99999237060547" y="308.71795654296875" width="216.97434997558594" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="374.71795654296875" width="149.26602172851562" height="17.333332061767578" fill="black" rx="2"/><rect x="75.99999237060547" y="389.6410217285156" width="145.24862670898438" height="21.435895919799805" fill="black" rx="2"/><rect x="75.99999237060547" y="408.7179260253906" width="173.21762084960938" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="423.7435607910156" width="164.84107971191406" height="16.30769157409668" fill="black" rx="2"/><rect x="375.9999694824219" y="374.71795654296875" width="95.51602172851562" height="17.333332061767578" fill="black" rx="2"/><rect x="375.9999694824219" y="389.6410217285156" width="78.75148010253906" height="21.435895919799805" fill="black" rx="2"/><rect x="375.9999694824219" y="408.7179260253906" width="165.7120819091797" height="18.358973503112793" fill="black" rx="2"/><rect x="375.9999694824219" y="423.7435607910156" width="148.88299560546875" height="16.30769157409668" fill="black" rx="2"/><rect x="251.80126953125" y="501.7179260253906" width="177.0609893798828" height="18.358973503112793" fill="black" rx="2"/><rect x="527.3189086914062" y="559.7948608398438" width="59.819156646728516" height="14.256409645080566" fill="black" rx="2"/><rect x="75.99999237060547" y="558.7179565429688" width="173.30447387695312" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="573.6409912109375" width="173.56088256835938" height="21.435895919799805" fill="black" rx="2"/><rect x="75.99999237060547" y="592.7179565429688" width="231.24786376953125" height="18.358973503112793" fill="black" rx="2"/><rect x="531.9823608398438" y="649.7948608398438" width="50.4809684753418" height="14.256409645080566" fill="black" rx="2"/><rect x="75.99999237060547" y="648.7178955078125" width="142.99998474121094" height="18.358973503112793" fill="black" rx="2"/><rect x="75.99999237060547" y="663.6409912109375" width="149.1217803955078" height="21.435895919799805" fill="black" rx="2"/><rect x="75.99999237060547" y="682.7179565429688" width="208.7211456298828" height="18.358973503112793" fill="black" rx="2"/><rect x="244.96632385253906" y="737.6409912109375" width="190.31475830078125" height="21.435895919799805" fill="black" rx="2"/><rect x="199.66184997558594" y="758.7178955078125" width="281.74810791015625" height="18.358973503112793" fill="black" rx="2"/><rect x="273.79644775390625" y="803.7435913085938" width="132.40704345703125" height="16.30769157409668" fill="black" rx="2"/><rect x="74.65383911132812" y="835.6922607421875" width="71.74774169921875" height="19.384614944458008" fill="black" rx="2"/><rect x="67.39422607421875" y="854.7692260742188" width="85.49324798583984" height="15.282051086425781" fill="black" rx="2"/><rect x="223.7195587158203" y="835.6922607421875" width="79.61804962158203" height="19.384614944458008" fill="black" rx="2"/><rect x="220.5705108642578" y="854.7692260742188" width="85.13541412353516" height="15.282051086425781" fill="black" rx="2"/><rect x="384.6682434082031" y="835.6922607421875" width="62.66345977783203" height="19.384614944458008" fill="black" rx="2"/><rect x="377.264404296875" y="854.7692260742188" width="77.10929107666016" height="15.282051086425781" fill="black" rx="2"/><rect x="546.6826782226562" y="835.6922607421875" width="44.634613037109375" height="19.384614944458008" fill="black" rx="2"/><rect x="514.0865478515625" y="854.7692260742188" width="109.44749450683594" height="15.282051086425781" fill="black" rx="2"/><rect x="198.09934997558594" y="888.7691650390625" width="284.8426818847656" height="15.282051086425781" fill="black" rx="2"/></mask></defs>

<rect x="10" y="10" width="660" height="915" rx="24" fill="#0b0f1a" stroke="#232a3d" stroke-width="1" style="fill:rgb(11, 15, 26);stroke:rgb(35, 42, 61);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<text x="340" y="45" text-anchor="middle" font-size="20" font-weight="500" fill="#cfd3f5" style="fill:rgb(207, 211, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:20px;font-weight:500;text-anchor:middle;dominant-baseline:auto">GitHub PR review assistant</text>
<text x="340" y="66" text-anchor="middle" font-size="10.5" letter-spacing="1.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">CONTEXT-AWARE REVIEW PIPELINE</text>
<line x1="140" y1="82" x2="540" y2="82" stroke="#232a3d" stroke-width="1" style="fill:rgb(0, 0, 0);stroke:rgb(35, 42, 61);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="210" y="100" width="260" height="54" rx="27" fill="#4c3fc9" stroke="#8b7cf6" stroke-width="1" style="fill:rgb(76, 63, 201);stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="118" text-anchor="middle" font-size="9" letter-spacing="1.2" fill="#c9c3fb" style="fill:rgb(201, 195, 251);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">REQUEST</text>
<text x="340" y="138" text-anchor="middle" font-size="13" font-weight="500" fill="#ffffff" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:middle;dominant-baseline:auto">Pull request opened</text>

<line x1="340" y1="154" x2="340" y2="174" stroke="#8b7cf6" stroke-width="1.5" marker-end="url(#arrow)" style="fill:rgb(0, 0, 0);stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="60" y="176" width="560" height="70" rx="10" fill="#12172a" stroke="#8b7cf6" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<rect x="505" y="184" width="105" height="18" rx="9" fill="none" stroke="#8b7cf6" stroke-width="0.75" style="fill:none;stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:0.75px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="557" y="196" text-anchor="middle" font-size="8.5" font-family="monospace" fill="#8b7cf6" style="fill:rgb(139, 124, 246);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:monospace;font-size:8.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">pull_request.py</text>
<text x="80" y="198" font-size="10.5" font-weight="500" letter-spacing="0.5" fill="#8b7cf6" style="fill:rgb(139, 124, 246);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:500;text-anchor:start;dominant-baseline:auto">STEP 1 — FETCH PR DIFF</text>
<text x="80" y="216" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">GitHub API retrieves diff &amp; PR metadata</text>
<text x="80" y="232" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">→ Used as review target instead of full repo</text>

<line x1="340" y1="246" x2="340" y2="264" stroke="#22c3a6" stroke-width="1.5" marker-end="url(#arrow)" style="fill:rgb(0, 0, 0);stroke:rgb(34, 195, 166);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="60" y="266" width="560" height="70" rx="10" fill="#12172a" stroke="#22c3a6" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(34, 195, 166);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<rect x="505" y="274" width="105" height="18" rx="9" fill="none" stroke="#22c3a6" stroke-width="0.75" style="fill:none;stroke:rgb(34, 195, 166);color:rgb(11, 11, 11);stroke-width:0.75px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="557" y="286" text-anchor="middle" font-size="8.5" font-family="monospace" fill="#22c3a6" style="fill:rgb(34, 195, 166);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:monospace;font-size:8.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">retriever.py</text>
<text x="80" y="288" font-size="10.5" font-weight="500" letter-spacing="0.5" fill="#22c3a6" style="fill:rgb(34, 195, 166);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:500;text-anchor:start;dominant-baseline:auto">STEP 2 — HYBRID CONTEXT RETRIEVAL</text>
<text x="80" y="306" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">Embeds diff &amp; queries repository index</text>
<text x="80" y="322" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">Semantic search + keyword search combined</text>

<path d="M340 336 C340 350,190 350,190 364" fill="none" stroke="#e24b4a" stroke-width="1.5" marker-end="url(#arrow)" style="fill:none;stroke:rgb(226, 75, 74);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<path d="M340 336 C340 350,490 350,490 364" fill="none" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)" style="fill:none;stroke:rgb(59, 130, 246);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="60" y="366" width="260" height="96" rx="10" fill="#12172a" stroke="#e24b4a" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(226, 75, 74);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="80" y="388" font-size="10" font-weight="500" fill="#e24b4a" style="fill:rgb(226, 75, 74);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10px;font-weight:500;text-anchor:start;dominant-baseline:auto">SEMANTIC SEARCH (PRIORITY)</text>
<text x="80" y="406" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">ChromaDB vector store</text>
<text x="80" y="422" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">sentence-transformers embeddings</text>
<text x="80" y="436" font-size="9.5" fill="#5b5f70" style="fill:rgb(91, 95, 112);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">Code-aware chunks · cosine similarity</text>

<rect x="360" y="366" width="260" height="96" rx="10" fill="#12172a" stroke="#3b82f6" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(59, 130, 246);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="380" y="388" font-size="10" font-weight="500" fill="#3b82f6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10px;font-weight:500;text-anchor:start;dominant-baseline:auto">KEYWORD SEARCH</text>
<text x="380" y="406" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">BM25 index</text>
<text x="380" y="422" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">Exact identifier &amp; symbol matches</text>
<text x="380" y="436" font-size="9.5" fill="#5b5f70" style="fill:rgb(91, 95, 112);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">Function names, variables, classes</text>

<path d="M190 462 C190 478,340 478,340 490" fill="none" stroke="#e24b4a" stroke-width="1.5" marker-end="url(#arrow)" style="fill:none;stroke:rgb(226, 75, 74);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<path d="M490 462 C490 478,340 478,340 490" fill="none" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)" style="fill:none;stroke:rgb(59, 130, 246);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="210" y="492" width="260" height="38" rx="8" fill="#12172a" stroke="#4b5163" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(75, 81, 99);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="515" text-anchor="middle" font-size="10.5" fill="#9aa0b4" style="fill:rgb(154, 160, 180);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">Merge · rank by combined relevance</text>

<line x1="340" y1="530" x2="340" y2="548" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arrow)" style="fill:rgb(0, 0, 0);stroke:rgb(245, 158, 11);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="60" y="550" width="560" height="70" rx="10" fill="#12172a" stroke="#f59e0b" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(245, 158, 11);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<rect x="505" y="558" width="105" height="18" rx="9" fill="none" stroke="#f59e0b" stroke-width="0.75" style="fill:none;stroke:rgb(245, 158, 11);color:rgb(11, 11, 11);stroke-width:0.75px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="557" y="570" text-anchor="middle" font-size="8.5" font-family="monospace" fill="#f59e0b" style="fill:rgb(245, 158, 11);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:monospace;font-size:8.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">reviewer.py</text>
<text x="80" y="572" font-size="10.5" font-weight="500" letter-spacing="0.5" fill="#f59e0b" style="fill:rgb(245, 158, 11);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:500;text-anchor:start;dominant-baseline:auto">STEP 3 — REVIEW GENERATION</text>
<text x="80" y="590" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">LLaMA 3.3-70B via Groq API</text>
<text x="80" y="606" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">PR diff + top relevant chunks · repo conventions</text>

<line x1="340" y1="620" x2="340" y2="638" stroke="#22c55e" stroke-width="1.5" marker-end="url(#arrow)" style="fill:rgb(0, 0, 0);stroke:rgb(34, 197, 94);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="60" y="640" width="560" height="70" rx="10" fill="#12172a" stroke="#22c55e" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(34, 197, 94);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<rect x="505" y="648" width="105" height="18" rx="9" fill="none" stroke="#22c55e" stroke-width="0.75" style="fill:none;stroke:rgb(34, 197, 94);color:rgb(11, 11, 11);stroke-width:0.75px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="557" y="660" text-anchor="middle" font-size="8.5" font-family="monospace" fill="#22c55e" style="fill:rgb(34, 197, 94);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:monospace;font-size:8.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">router.py</text>
<text x="80" y="662" font-size="10.5" font-weight="500" letter-spacing="0.5" fill="#22c55e" style="fill:rgb(34, 197, 94);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:500;text-anchor:start;dominant-baseline:auto">STEP 4 — POST DECISION</text>
<text x="80" y="680" font-size="13" font-weight="500" fill="#e8e9f5" style="fill:rgb(232, 233, 245);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13px;font-weight:500;text-anchor:start;dominant-baseline:auto">should_post_comment()</text>
<text x="80" y="696" font-size="10.5" fill="#7d8296" style="fill:rgb(125, 130, 150);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:start;dominant-baseline:auto">Review exists → post comment · else → end</text>

<line x1="340" y1="710" x2="340" y2="728" stroke="#8b7cf6" stroke-width="1.5" marker-end="url(#arrow)" style="fill:rgb(0, 0, 0);stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="100" y="730" width="480" height="64" rx="14" fill="#4c3fc9" stroke="#8b7cf6" stroke-width="1" style="fill:rgb(76, 63, 201);stroke:rgb(139, 124, 246);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="754" text-anchor="middle" font-size="13.5" font-weight="500" fill="#ffffff" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:13.5px;font-weight:500;text-anchor:middle;dominant-baseline:auto">Cited review + source context</text>
<text x="340" y="772" text-anchor="middle" font-size="10.5" fill="#d7d3fb" style="fill:rgb(215, 211, 251);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:10.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">→ Posted as GitHub PR comment + saved to SQLite history</text>

<line x1="110" y1="812" x2="300" y2="812" stroke="#232a3d" stroke-width="1" mask="url(#imagine-text-gaps-wtiow3)" style="fill:rgb(0, 0, 0);stroke:rgb(35, 42, 61);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="816" text-anchor="middle" font-size="9.5" letter-spacing="1.5" fill="#5b5f70" style="fill:rgb(91, 95, 112);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9.5px;font-weight:400;text-anchor:middle;dominant-baseline:auto">SYSTEM COMPONENTS</text>
<line x1="380" y1="812" x2="570" y2="812" stroke="#232a3d" stroke-width="1" mask="url(#imagine-text-gaps-wtiow3)" style="fill:rgb(0, 0, 0);stroke:rgb(35, 42, 61);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<rect x="40" y="828" width="140" height="50" rx="8" fill="#12172a" stroke="#333a4d" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(51, 58, 77);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="110" y="850" text-anchor="middle" font-size="11" font-weight="500" fill="#c7cbe0" style="fill:rgb(199, 203, 224);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:11px;font-weight:500;text-anchor:middle;dominant-baseline:auto">GitHub layer</text>
<text x="110" y="866" text-anchor="middle" font-size="9" fill="#6b7086" style="fill:rgb(107, 112, 134);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">auth · repo · PR ops</text>

<rect x="193" y="828" width="140" height="50" rx="8" fill="#12172a" stroke="#333a4d" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(51, 58, 77);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="263" y="850" text-anchor="middle" font-size="11" font-weight="500" fill="#c7cbe0" style="fill:rgb(199, 203, 224);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:11px;font-weight:500;text-anchor:middle;dominant-baseline:auto">Indexing layer</text>
<text x="263" y="866" text-anchor="middle" font-size="9" fill="#6b7086" style="fill:rgb(107, 112, 134);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">ChromaDB + BM25</text>

<rect x="346" y="828" width="140" height="50" rx="8" fill="#12172a" stroke="#333a4d" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(51, 58, 77);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="416" y="850" text-anchor="middle" font-size="11" font-weight="500" fill="#c7cbe0" style="fill:rgb(199, 203, 224);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:11px;font-weight:500;text-anchor:middle;dominant-baseline:auto">LangGraph</text>
<text x="416" y="866" text-anchor="middle" font-size="9" fill="#6b7086" style="fill:rgb(107, 112, 134);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">4-node workflow</text>

<rect x="499" y="828" width="140" height="50" rx="8" fill="#12172a" stroke="#333a4d" stroke-width="1" style="fill:rgb(18, 23, 42);stroke:rgb(51, 58, 77);color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="569" y="850" text-anchor="middle" font-size="11" font-weight="500" fill="#c7cbe0" style="fill:rgb(199, 203, 224);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:11px;font-weight:500;text-anchor:middle;dominant-baseline:auto">FastAPI</text>
<text x="569" y="866" text-anchor="middle" font-size="9" fill="#6b7086" style="fill:rgb(107, 112, 134);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">/review /repos /webhook</text>

<text x="340" y="900" text-anchor="middle" font-size="9" fill="#4b5066" style="fill:rgb(75, 80, 102);stroke:none;color:rgb(11, 11, 11);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:anthropic-sans, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:9px;font-weight:400;text-anchor:middle;dominant-baseline:auto">ChromaDB · BM25 · LangGraph · Groq LLaMA 3.3-70B · FastAPI · React</text>
</svg>pr_review_pipeline.svg…]()
