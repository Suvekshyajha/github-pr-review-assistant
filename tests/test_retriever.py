from github.auth import get_repo_tree
from indexing.vectordb import VectorDB
from indexing.bm25 import BM25Index
from indexing.loader import index_repo
from indexing.retriever import HybridRetriever

if __name__ == "__main__":
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    db = VectorDB()
    
    chunks, metadatas = index_repo("Suvekshyajha", "small_python-project", tree, db)
    
    bm25 = BM25Index()
    bm25.build(chunks, metadatas)
    
    retriever = HybridRetriever(db, bm25)
    
    print("\n--- Hybrid Query Results ---")
    results = retriever.query("how is authentication handled")
    for r in results:
        print(f"[{r['source']}] {r['metadata']['file_path']} → {r['chunk'][:100]}")