from github.auth import get_repo_tree
from indexing.vectordb import VectorDB
from indexing.bm25 import BM25Index
from indexing.loader import index_repo
from indexing.retriever import HybridRetriever
from graph.graph import build_graph

_graphs = {}  # "owner/repo" -> compiled graph, kept in memory

def get_or_build_graph(owner: str, repo: str, branch: str = "main"):
    key = f"{owner}/{repo}"

    if key in _graphs:
        return _graphs[key]

    print(f"Indexing {key} for the first time...")
    tree = get_repo_tree(owner, repo, branch)
    # separate ChromaDB collection per repo — otherwise different repos' code chunks mix together in search results
    db = VectorDB(collection_name=key.replace("/", "_"))
    chunks, metadatas = index_repo(owner, repo, tree, db)

    bm25 = BM25Index()
    bm25.build(chunks, metadatas)

    retriever = HybridRetriever(db, bm25)
    built = build_graph(retriever)

    _graphs[key] = built
    return built