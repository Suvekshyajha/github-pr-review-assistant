from indexing.vectordb import VectorDB

def embed_file(file_path: str, chunks: list[str], db: VectorDB):
    if not chunks:
        return
    ids = [f"{file_path}::chunk{i}" for i in range(len(chunks))]
    metadatas = [{"file_path": file_path, "chunk_index": i} for i in range(len(chunks))]
    db.add(chunks, metadatas, ids)