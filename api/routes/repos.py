from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from github.webhooks import create_webhook, delete_webhook
from api.db import save_connected_repo, get_all_connected_repos, delete_connected_repo
import os

router = APIRouter()

WEBHOOK_BASE_URL = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")

class ConnectRepoRequest(BaseModel):
    owner: str
    repo: str

@router.post("/repos/connect")
def connect_repo(req: ConnectRepoRequest):
    webhook_url = f"{WEBHOOK_BASE_URL}/webhook"
    try:
        webhook = create_webhook(req.owner, req.repo, webhook_url)
        save_connected_repo(req.owner, req.repo, webhook["id"])
        return {"message": f"Connected {req.owner}/{req.repo}", "webhook_id": webhook["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/repos")
def list_repos():
    return get_all_connected_repos()

@router.delete("/repos/{repo_id}")
def disconnect_repo(repo_id: int):
    repo = delete_connected_repo(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    try:
        delete_webhook(repo["owner"], repo["repo"], repo["webhook_id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": f"Disconnected {repo['owner']}/{repo['repo']}"}