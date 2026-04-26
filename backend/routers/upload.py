from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import UploadResponse, DeleteResponse
from services.pdf_service import save_upload, extract_text, get_page_count
from services.rag_service import store_chunks, delete_document
from utils.chunker import chunk_pages
from config import settings

router = APIRouter(prefix="/api", tags=["upload"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Full PDF processing pipeline:
    1. Validate → 2. Save → 3. Extract text → 4. Chunk → 5. Embed & store
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be under 20 MB.")

    try:
        doc_id, file_path = save_upload(content, file.filename)

        pages = extract_text(file_path)
        if not pages:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted. This might be a scanned PDF.",
            )

        chunks = chunk_pages(pages, settings.chunk_size, settings.chunk_overlap)
        chunk_count = store_chunks(doc_id, chunks)

        return UploadResponse(
            doc_id=doc_id,
            filename=file.filename,
            page_count=get_page_count(file_path),
            chunk_count=chunk_count,
            message="PDF processed and ready to chat.",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.delete("/document/{doc_id}", response_model=DeleteResponse)
async def delete_doc(doc_id: str):
    """Delete all stored embeddings for a document."""
    try:
        delete_document(doc_id)
        return DeleteResponse(message=f"Document {doc_id} removed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
