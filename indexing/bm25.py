from rank_bm25 import BM25Okapi

class BM25Index:
    def __init__(self):
        self.chunks = []
        self.metadatas = []
        self.index = None

    def build(self, chunks: list[str], metadatas: list[dict]):
        self.chunks = chunks
        self.metadatas = metadatas
        tokenized = [chunk.lower().split() for chunk in chunks]
        self.index = BM25Okapi(tokenized)

    def query(self, query_text: str, n_results: int = 5) -> list[dict]:
        if self.index is None:
            raise ValueError("BM25 index not built yet. Call build() first.")
        tokens = query_text.lower().split()
        scores = self.index.get_scores(tokens)
        top_n = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n_results]
        return [
            {"chunk": self.chunks[i], "metadata": self.metadatas[i], "score": scores[i]}
            for i in top_n
        ]