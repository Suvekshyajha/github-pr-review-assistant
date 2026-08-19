from github.pull_request import get_pr_diff, post_pr_comment
from indexing.retriever import HybridRetriever
from groq import Groq
from utils.config import GROQ_API_KEY
from graph.state import PRReviewState

client = Groq(api_key=GROQ_API_KEY)

REVIEW_PROMPT = """You are an expert code reviewer. You will be given:
1. A PR diff showing what changed
2. Relevant context chunks from the existing codebase

Your job is to review the PR and provide feedback on:
- Bugs or errors introduced
- Suggested improvements
- Cross-file impact (does this change break or affect other parts of the codebase?)
- Convention mismatches (does this follow the existing code style/patterns?)

Be specific, reference line numbers from the diff where possible.

PR Diff:
{diff}

Relevant Codebase Context:
{context}

Provide a clear, structured plain text review."""


def fetch_diff(state: PRReviewState) -> PRReviewState:
    diff = get_pr_diff(state["owner"], state["repo"], state["pr_number"])
    return {**state, "diff": diff}


def retrieve_context(state: PRReviewState, retriever: HybridRetriever) -> PRReviewState:
    results = retriever.query(state["diff"][:500], n_results=5)
    return {**state, "context_chunks": results}


def review_pr(state: PRReviewState) -> PRReviewState:
    context_text = "\n\n".join(
        f"[{r['metadata']['file_path']}]\n{r['chunk']}"
        for r in state["context_chunks"]
    )
    prompt = REVIEW_PROMPT.format(diff=state["diff"], context=context_text)
    response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}]
    )
    review = response.choices[0].message.content
    return {**state, "review": review}


def post_comment(state: PRReviewState) -> PRReviewState:
    post_pr_comment(state["owner"], state["repo"], state["pr_number"], state["review"])
    print("✅ Posted review to GitHub PR")
    return state