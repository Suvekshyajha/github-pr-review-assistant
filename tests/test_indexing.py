from github.auth import get_repo_tree
from indexing.vectordb import VectorDB
from indexing.loader import index_repo

if __name__ == "__main__":
    tree = get_repo_tree("Suvekshyajha", "small_python-project", "main")
    db = VectorDB()
    index_repo("Suvekshyajha", "small_python-project", tree, db)
    print("Done. Testing a query...")
    results = db.query("how is authentication handled")
    for doc in results["documents"][0]:
        print(doc[:100])