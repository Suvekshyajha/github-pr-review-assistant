from fastapi import APIRouter, BackgroundTasks, Request
from api.db import save_review

router = APIRouter()
graph = None  # injected from main.py

def run_review_and_save(owner: str, repo: str, pr_number: int):
    try:
        result = graph.invoke({
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "diff": "",
            "context_chunks": [],
            "review": ""
        })
        save_review(owner, repo, pr_number, result["review"], result["context_chunks"])
        print(f"✅ Auto-review saved for PR #{pr_number}")
    except Exception as e:
        print(f"❌ Webhook review failed: {e}")

@router.post("/webhook")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    if payload.get("action") == "opened":
        pr = payload["pull_request"]
        owner = payload["repository"]["owner"]["login"]
        repo = payload["repository"]["name"]
        pr_number = pr["number"]
        print(f"🔔 PR #{pr_number} opened on {owner}/{repo} — queuing review")
        background_tasks.add_task(run_review_and_save, owner, repo, pr_number)
    return {"status": "received"}