from indexing.vectordb import VectorDB
from indexing.bm25 import BM25Index

class HybridRetriever:
    def __init__(self, db: VectorDB, bm25: BM25Index):
        self.db = db
        self.bm25 = bm25

    def query(self, query_text: str, n_results: int = 5) -> list[dict]:
        # vector search
        vector_results = self.db.query(query_text, n_results=n_results)
        vector_chunks = vector_results["documents"][0]
        vector_metas = vector_results["metadatas"][0]

        # bm25 search
        bm25_results = self.bm25.query(query_text, n_results=n_results)

        # merge and deduplicate
        seen = set()
        combined = []

        for chunk, meta in zip(vector_chunks, vector_metas):
            if chunk not in seen:
                seen.add(chunk)
                combined.append({"chunk": chunk, "metadata": meta, "source": "vector"})

        for result in bm25_results:
            if result["chunk"] not in seen:
                seen.add(result["chunk"])
                combined.append({"chunk": result["chunk"], "metadata": result["metadata"], "source": "bm25"})

        return combined[:n_results]