import uuid
from fastapi import APIRouter, UploadFile, HTTPException
from google.genai import errors
from services.pdf_service import extract_text
from services.rag_service import store_chunks, delete_document
from utils.chunker import chunk_pages

router = APIRouter(prefix="/api")

MAX_FILE_SIZE = 20 * 1024 * 1024


# Plain `def` so FastAPI runs it in a thread; the embedding calls would
# otherwise block every other request while a PDF is processed.
@router.post("/upload")
def upload_pdf(file: UploadFile):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(400, "File must be under 20 MB.")

    try:
        pages, page_count = extract_text(file.file.read())
    except Exception:
        raise HTTPException(400, "Could not read this PDF.")
    if not pages:
        raise HTTPException(400, "No text could be extracted. This might be a scanned PDF.")

    doc_id = uuid.uuid4().hex[:8]
    try:
        chunk_count = store_chunks(doc_id, chunk_pages(pages))
    except errors.APIError as e:
        if e.code == 429:
            raise HTTPException(429, "Gemini’s free quota is used up for now. Try again in a few minutes.")
        raise HTTPException(502, f"Gemini error: {e.message}")
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {e}")

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "page_count": page_count,
        "chunk_count": chunk_count,
    }


@router.delete("/document/{doc_id}")
def delete_doc(doc_id: str):
    delete_document(doc_id)
    return {"message": f"Document {doc_id} removed."}
