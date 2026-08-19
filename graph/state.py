from typing import TypedDict

class PRReviewState(TypedDict):
    owner: str
    repo: str
    pr_number: int
    diff: str
    context_chunks: list[dict]
    review: str