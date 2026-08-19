from graph.state import PRReviewState

def should_post_comment(state: PRReviewState) -> str:
    if state.get("review"):
        return "post_comment"
    return "end"