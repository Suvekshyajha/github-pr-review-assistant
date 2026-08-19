import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

class VectorDB:
    def __init__(self, collection_name="code_chunks", persist_dir="./chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.embed_fn = SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embed_fn
        )

    def add(self, chunks: list[str], metadatas: list[dict], ids: list[str]):
        self.collection.add(documents=chunks, metadatas=metadatas, ids=ids)

    def query(self, query_text: str, n_results: int = 5):
        return self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )