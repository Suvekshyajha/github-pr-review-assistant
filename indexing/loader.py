from github.auth import get_file_content
from github.repo import filter_code_files
from indexing.splitter import chunk_code
from indexing.embeddings import embed_file
from indexing.vectordb import VectorDB

def index_repo(owner: str, repo: str, tree: list, db: VectorDB):
    code_files = filter_code_files(tree)
    all_chunks = []
    all_metadatas = []

    for file in code_files:
        content = get_file_content(owner, repo, file["sha"])
        chunks = chunk_code(content, file["path"])
        embed_file(file["path"], chunks, db)

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadatas.append({"file_path": file["path"], "chunk_index": i})

        print(f"✅ indexed {file['path']} → {len(chunks)} chunks")

    return all_chunks, all_metadatas  # ← BM25 needs these