import requests
from utils.config import GITHUB_TOKEN

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

def create_webhook(owner: str, repo: str, webhook_url: str) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}/hooks"
    payload = {
        "config": {"url": webhook_url, "content_type": "json"},
        "events": ["pull_request"],
        "active": True
    }
    response = requests.post(url, json=payload, headers=HEADERS)
    if response.status_code != 201:
        raise Exception(f"Failed to create webhook: {response.status_code} - {response.text}")
    return response.json()

def delete_webhook(owner: str, repo: str, webhook_id: int) -> None:
    url = f"https://api.github.com/repos/{owner}/{repo}/hooks/{webhook_id}"
    response = requests.delete(url, headers=HEADERS)
    if response.status_code != 204:
        raise Exception(f"Failed to delete webhook: {response.status_code} - {response.text}")