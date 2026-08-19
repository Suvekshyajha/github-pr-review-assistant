# tests/test_graph.py
from github.auth import get_repo_tree
from indexing.vectordb import VectorDB
from indexing.bm25 import BM25Index
from indexing.loader import index_repo
from indexing.retriever import HybridRetriever
from graph.graph import build_graph

if __name__ == "__main__":
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    db = VectorDB()
    chunks, metadatas = index_repo("Suvekshyajha", "small_python-project", tree, db)
    
    bm25 = BM25Index()
    bm25.build(chunks, metadatas)
    
    retriever = HybridRetriever(db, bm25)
    graph = build_graph(retriever)
    
    result = graph.invoke({
        "owner": "Suvekshyajha",
        "repo": "small_python-project",
        "pr_number": 1,       # ← replace with a real PR number
        "diff": "",
        "context_chunks": [],
        "review": ""
    })
    
    print(result["review"])