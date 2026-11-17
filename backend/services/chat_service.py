import asyncio
import json
from google.genai import errors, types
from config import settings
from services.rag_service import query_chunks
from utils.embedder import client
from utils.prompt_builder import build_system_prompt, build_user_prompt


# Least "thinking" the model allows: answers come from the given passages, so thinking only
# delays the first word (10s+ on 3.x Flash at default). 2.5 models and 3.x models take different settings.
FAST = (types.ThinkingConfig(thinking_budget=0) if "2.5" in settings.llm_model
        else types.ThinkingConfig(thinking_level="minimal"))


def event(type, content=None):
    return f"data: {json.dumps({'type': type, 'content': content})}\n\n"


async def stream_answer(doc_id, question, mode, chat_history):
    try:
        chunks = await asyncio.to_thread(query_chunks, doc_id, question)
        # Full chunk text: the frontend highlights it in the PDF
        yield event("sources", [{"page": c["page"], "text": c["text"]} for c in chunks])

        stream = await client.aio.models.generate_content_stream(
            model=settings.llm_model,
            contents=build_user_prompt(question, chunks, chat_history),
            config=types.GenerateContentConfig(
                system_instruction=build_system_prompt(mode),
                temperature=0.3,
                thinking_config=FAST,
            ),
        )
        async for part in stream:
            if part.text:
                yield event("token", part.text)
    except errors.APIError as e:
        msg = "Gemini’s free quota is used up for now. Try again later." if e.code == 429 else f"Gemini error: {e.message}"
        yield event("error", msg)
    except Exception as e:
        yield event("error", f"Something went wrong: {e}")

    yield event("done")
