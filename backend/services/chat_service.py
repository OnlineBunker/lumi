from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from config import settings
from utils.prompt_builder import build_system_prompt, build_user_prompt
from services.rag_service import query_chunks
from typing import AsyncGenerator, List
import json

# Single LLM instance — streaming=True enables token-by-token generation
llm = ChatGoogleGenerativeAI(
    model=settings.llm_model,
    google_api_key=settings.gemini_api_key,
    streaming=True,
    temperature=0.3,  # lower = more factual, less creative hallucination
)


async def stream_answer(
    doc_id: str,
    question: str,
    mode: str = "default",
    chat_history: List[dict] = None,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline as a streaming SSE generator.

    Flow:
    1. Retrieve relevant chunks from Chroma
    2. Send source metadata first (so UI can show citations immediately)
    3. Stream LLM tokens as they arrive
    4. Send 'done' event to signal completion
    """

    # Step 1 — Retrieve
    chunks = query_chunks(doc_id, question)
    if not chunks:
        yield f"data: {json.dumps({'type': 'error', 'content': 'No relevant content found in this document.'})}\n\n"
        return

    # Step 2 — Send sources immediately (UI shows page chips before answer)
    sources = [{"page": c["page"], "text": c["text"][:120] + "…"} for c in chunks]
    yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"

    # Step 3 — Build prompts
    system = build_system_prompt(mode)
    user = build_user_prompt(question, chunks, chat_history or [])

    # Step 4 — Stream tokens from LLM
    async for token in llm.astream([
        SystemMessage(content=system),
        HumanMessage(content=user),
    ]):
        if token.content:
            yield f"data: {json.dumps({'type': 'token', 'content': token.content})}\n\n"

    # Step 5 — Signal frontend that stream is complete
    yield f"data: {json.dumps({'type': 'done'})}\n\n"