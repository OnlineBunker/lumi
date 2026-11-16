from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.chat_service import stream_answer
from services.rag_service import has_document

router = APIRouter(prefix="/api")


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    # Render's free disk is wiped on restart; the frontend re-uploads on this 404.
    if not has_document(req.doc_id):
        raise HTTPException(404, "Document not found.")

    history = [m.model_dump() for m in req.chat_history]
    return StreamingResponse(
        stream_answer(req.doc_id, req.question, req.mode, history),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
