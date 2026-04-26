from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.chat_service import stream_answer

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Stream a RAG-powered answer as Server-Sent Events (SSE).
    Frontend reads the stream token by token.
    """
    if not request.doc_id:
        raise HTTPException(status_code=400, detail="doc_id is required.")
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    return StreamingResponse(
        stream_answer(
            doc_id=request.doc_id,
            question=request.question,
            mode=request.mode,
            chat_history=[m.model_dump() for m in request.chat_history],
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disables nginx buffering — required for streaming
        },
    )
