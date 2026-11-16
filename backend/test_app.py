"""Run from backend/: python -m unittest"""
import os
import tempfile
import unittest

os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ["VECTOR_STORE_DIR"] = tempfile.mkdtemp()

import fitz
from fastapi.testclient import TestClient
from main import app
from services.pdf_service import extract_text
from utils.chunker import chunk_pages


def make_pdf(*page_texts):
    doc = fitz.open()
    for text in page_texts:
        doc.new_page().insert_textbox(fitz.Rect(50, 50, 550, 800), text)
    return doc.tobytes()


class PipelineTest(unittest.TestCase):
    def test_blank_pages_skipped_but_counted(self):
        pages, count = extract_text(make_pdf("first page", "", "third page"))
        self.assertEqual(count, 3)
        self.assertEqual([p["page"] for p in pages], [1, 3])

    def test_chunks_keep_their_page_and_are_never_empty(self):
        chunks = chunk_pages([{"page": 4, "text": "word " * 400}, {"page": 7, "text": "  \n\n  "}])
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(c["page"] == 4 and c["text"] for c in chunks))

    def test_chat_on_unknown_doc_is_404(self):
        res = TestClient(app).post("/api/chat", json={"doc_id": "gone", "question": "hi"})
        self.assertEqual(res.status_code, 404)

    def test_upload_rejects_non_pdf(self):
        res = TestClient(app).post("/api/upload", files={"file": ("x.pdf", b"not a pdf")})
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
