from github.auth import get_repo_tree, get_file_content
from github.repo import filter_code_files
from indexing.splitter import chunk_code

if __name__ == "__main__":
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    code_files = filter_code_files(tree)

    for file in code_files:
        content = get_file_content("Suvekshyajha", "small_python-project", file["sha"])
        chunks = chunk_code(content, file["path"])
        print(f"--- {file['path']} ({len(chunks)} chunks) ---")
        for i, chunk in enumerate(chunks):
            print(f"Chunk {i}: {chunk[:100]}...")
        print()