from fastapi import FastAPI
from github.auth import get_repo_tree
from indexing.vectordb import VectorDB
from indexing.bm25 import BM25Index
from indexing.loader import index_repo
from indexing.retriever import HybridRetriever
from graph.graph import build_graph
from api.routes import review, history, webhook
from api.db import init_db
from api.routes import review, history, webhook, repos  # add repos

app = FastAPI(title="PR Review Agent")

@app.on_event("startup")
def setup():
    init_db()
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    db = VectorDB()
    chunks, metadatas = index_repo("Suvekshyajha", "small_python-project", tree, db)
    bm25 = BM25Index()
    bm25.build(chunks, metadatas)
    retriever = HybridRetriever(db, bm25)
    built_graph = build_graph(retriever)
    review.graph = built_graph
    webhook.graph = built_graph      # ← same graph, shared
    print("✅ Graph built and ready")

app.include_router(review.router)
app.include_router(history.router)
app.include_router(webhook.router)

@app.get("/")
def health_check():
    return {"status": "Backend reachable"}
app.include_router(repos.router)