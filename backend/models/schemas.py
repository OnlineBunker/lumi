from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    doc_id: str
    question: str
    mode: str = "default"
    chat_history: list[ChatMessage] = []
