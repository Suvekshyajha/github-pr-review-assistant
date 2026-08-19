from github.auth import get_repo_tree, get_file_content
def filter_code_files(tree:list[dict],extensions:tuple=(".py",".js",".ts",".java",".cpp",".c"))->list[dict]:
    """
    filter the code files from the repo tree based on the extensions
    Args:
        tree (list[dict]): list of dicts containing the repo tree
        extensions (tuple): tuple of extensions to filter the code files
    Returns:
        list[dict]: list of dicts containing the code files
    """
    code_files=[]
    for item in tree:
        if item["type"]=="blob" and item["path"].endswith(extensions):
            code_files.append(item)
    return code_files
#jsut test block

if __name__ == "__main__":
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    code_files = filter_code_files(tree)
    
    for file in code_files:
        content = get_file_content("Suvekshyajha", "small_python-project", file["sha"])
        print(f"--- {file['path']} ---")
        print(content[:200])  # just first 200 chars to sanity-check, not the whole file
        print()