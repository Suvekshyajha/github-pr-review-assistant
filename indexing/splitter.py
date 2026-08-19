from langchain_text_splitters import RecursiveCharacterTextSplitter , Language
def chunk_code(content: str, file_path: str) -> list[str]:
    """Split a code file's content into function/class-aware chunks."""
    if file_path.endswith(".py"):
        splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.PYTHON, chunk_size=500, chunk_overlap=50
        )
    elif file_path.endswith((".js", ".ts")):
        splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.JS, chunk_size=500, chunk_overlap=50
        )
    else:
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    chunks = splitter.split_text(content)
    return chunks