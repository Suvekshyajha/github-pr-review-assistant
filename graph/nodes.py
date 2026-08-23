from github.pull_request import get_pr_diff, post_pr_comment
from indexing.retriever import HybridRetriever
from graph.state import PRReviewState
from llm.reviewer import generate_review


def fetch_diff(state: PRReviewState) -> PRReviewState:
    diff = get_pr_diff(state["owner"], state["repo"], state["pr_number"])
    return {**state, "diff": diff}


def retrieve_context(state: PRReviewState, retriever: HybridRetriever) -> PRReviewState:
    results = retriever.query(state["diff"][:500], n_results=5)
    return {**state, "context_chunks": results}


def review_pr(state: PRReviewState) -> PRReviewState:
    review = generate_review(state["diff"], state["context_chunks"])
    return {**state, "review": review}


def post_comment(state: PRReviewState) -> PRReviewState:
    post_pr_comment(state["owner"], state["repo"], state["pr_number"], state["review"])
    print("✅ Posted review to GitHub PR")
    return state