from groq import Groq
from utils.config import GROQ_API_KEY

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


def build_context_text(context_chunks: list[dict]) -> str:
    """Format retrieved chunks into readable text for the prompt."""
    return "\n\n".join(
        f"[{r['metadata']['file_path']}]\n{r['chunk']}"
        for r in context_chunks
    )


def generate_review(diff: str, context_chunks: list[dict]) -> str:
    """Build the review prompt, call the LLM, return the review text."""
    context_text = build_context_text(context_chunks)
    prompt = REVIEW_PROMPT.format(diff=diff, context=context_text)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content