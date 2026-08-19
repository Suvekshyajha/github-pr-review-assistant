from langgraph.graph import StateGraph, END
from graph.state import PRReviewState
from graph.nodes import fetch_diff, retrieve_context, review_pr, post_comment
from graph.router import should_post_comment
from indexing.retriever import HybridRetriever

def build_graph(retriever: HybridRetriever) -> StateGraph:
    graph = StateGraph(PRReviewState)

    graph.add_node("fetch_diff", fetch_diff)
    graph.add_node("retrieve_context", lambda s: retrieve_context(s, retriever))
    graph.add_node("review_pr", review_pr)
    graph.add_node("post_comment", post_comment)

    graph.set_entry_point("fetch_diff")
    graph.add_edge("fetch_diff", "retrieve_context")
    graph.add_edge("retrieve_context", "review_pr")
    graph.add_conditional_edges("review_pr", should_post_comment, {
        "post_comment": "post_comment",
        "end": END
    })
    graph.add_edge("post_comment", END)

    return graph.compile()