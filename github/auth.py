import base64
import requests

from utils.config import GITHUB_TOKEN

def get_repo_tree(owner: str, repo: str, branch: str):
    """
    get the tree of repo in github using github api
    Args:
        owner (str): owner of the repo
        repo (str): name of the repo
        branch (str): name of the branch
        """
    url=f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}"
    params={"recursive":1}
    HEADERS={
    #github token or personal access key
    'Authorization': f'Bearer {GITHUB_TOKEN}',
    #format in which we want the response
    'Accept':'application/vnd.github+json',
    #git api ver for consistency even if api version is updated
    "X-Github-Api-Version": "2022-11-28"
    }
    response = requests.get(url, params=params, headers=HEADERS)
    if response.status_code == 200:
        return response.json()["tree"]
    else:
        raise Exception(f"Failed to get repo tree: {response.status_code} - {response.text}")   

    

def get_file_content(owner: str, repo: str, sha: str) -> str:
    """Fetch and decode a file's content from its blob sha."""
    url = f"https://api.github.com/repos/{owner}/{repo}/git/blobs/{sha}"
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json',
        "X-Github-Api-Version": "2022-11-28"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to get file content: {response.status_code} - {response.text}")

    content_encoded = response.json()["content"]
    content = base64.b64decode(content_encoded).decode("utf-8")
    return content