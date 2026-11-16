import asyncio
import json
from google.genai import types
from config import settings
from services.rag_service import query_chunks
from utils.embedder import client
from utils.prompt_builder import build_system_prompt, build_user_prompt


def event(type, content=None):
    return f"data: {json.dumps({'type': type, 'content': content})}\n\n"


async def stream_answer(doc_id, question, mode, chat_history):
    chunks = await asyncio.to_thread(query_chunks, doc_id, question)
    # Full chunk text: the frontend highlights it in the PDF
    yield event("sources", [{"page": c["page"], "text": c["text"]} for c in chunks])

    try:
        stream = await client.aio.models.generate_content_stream(
            model=settings.llm_model,
            contents=build_user_prompt(question, chunks, chat_history),
            config=types.GenerateContentConfig(
                system_instruction=build_system_prompt(mode),
                temperature=0.3,
            ),
        )
        async for part in stream:
            if part.text:
                yield event("token", part.text)
    except Exception as e:
        yield event("error", f"LLM error: {e}")

    yield event("done")
