from fastapi import APIRouter
from pydantic import BaseModel
from api.db import save_review

router = APIRouter()
graph = None

class ReviewRequest(BaseModel):
    owner: str
    repo: str
    pr_number: int

@router.post("/review")
def run_review(req: ReviewRequest):
    result = graph.invoke({
        "owner": req.owner,
        "repo": req.repo,
        "pr_number": req.pr_number,
        "diff": "",
        "context_chunks": [],
        "review": ""
    })
    save_review(req.owner, req.repo, req.pr_number, result["review"], result["context_chunks"])
    return {
        "review": result["review"],
        "context_chunks": result["context_chunks"]
    }