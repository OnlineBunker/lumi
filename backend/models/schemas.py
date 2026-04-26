from pydantic import BaseModel
from typing import List, Optional


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    page_count: int
    chunk_count: int
    message: str


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    doc_id: str
    question: str
    mode: str = "default"           # default | eli5 | student | pro | summary | translate
    chat_history: List[ChatMessage] = []


class DeleteResponse(BaseModel):
    message: str
