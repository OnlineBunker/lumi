from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from routers import upload, chat
from config import settings

app = FastAPI(
    title="PDF Chat API",
    description="RAG-powered PDF chat with streaming responses",
    version="1.0.0",
    docs_url="/docs",   # Swagger UI — test your API at localhost:8000/docs
)

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "PDF Chat API is running 🚀"}


@app.on_event("startup")
async def startup():
    """Create required directories on first run."""
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.vector_store_dir).mkdir(parents=True, exist_ok=True)
