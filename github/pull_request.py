import requests
from utils.config import GITHUB_TOKEN

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

def get_pr_diff(owner: str, repo: str, pr_number: int) -> str:
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
    response = requests.get(url, headers={**HEADERS, "Accept": "application/vnd.github.v3.diff"})
    if response.status_code == 200:
        return response.text
    raise Exception(f"Failed to get PR diff: {response.status_code} - {response.text}")

def post_pr_comment(owner: str, repo: str, pr_number: int, body: str) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments"
    response = requests.post(url, headers=HEADERS, json={"body": body})
    if response.status_code == 201:
        return response.json()
    raise Exception(f"Failed to post comment: {response.status_code} - {response.text}")