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
from utils.chunker import chunk_pages, split_text
import services.rag_service as rag


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

    def test_split_respects_size_and_overlaps(self):
        text = "\n\n".join(f"Sentence {i} is about sleep and memory." for i in range(60))
        chunks = split_text(text, 200, 60)
        self.assertTrue(all(len(c) <= 200 for c in chunks))
        self.assertTrue(all(a.split(". ")[-1] in b for a, b in zip(chunks, chunks[1:])))  # last piece repeats
        self.assertEqual(split_text("x" * 450, 200, 0), ["x" * 200, "x" * 200, "x" * 50])

    def test_vector_store_finds_the_closest_chunk_and_survives_cache_eviction(self):
        fake = {"cats purr": [1, 0, 0], "dogs bark": [0, 1, 0], "fish swim": [0, 0, 1], "meow?": [0.9, 0.1, 0]}
        rag.embed_documents = lambda texts: [fake[t] for t in texts]
        rag.embed_query = lambda t: fake[t]
        rag.store_chunks("abcd1234", [{"text": t, "page": i + 1} for i, t in enumerate(list(fake)[:3])])
        rag._cache.clear()  # force a reload from disk
        rag.settings.top_k_chunks = 1
        self.assertEqual(rag.query_chunks("abcd1234", "meow?"), [{"text": "cats purr", "page": 1}])
        rag.settings.top_k_chunks = 5
        self.assertTrue(rag.has_document("abcd1234"))
        rag.delete_document("abcd1234")
        self.assertFalse(rag.has_document("abcd1234"))

    def test_doc_ids_cannot_reach_other_files(self):
        self.assertFalse(rag.has_document("../../etc/passwd"))
        rag.delete_document("../config")  # must not raise or touch anything

    def test_chat_on_unknown_doc_is_404(self):
        res = TestClient(app).post("/api/chat", json={"doc_id": "gone", "question": "hi"})
        self.assertEqual(res.status_code, 404)

    def test_upload_rejects_non_pdf(self):
        res = TestClient(app).post("/api/upload", files={"file": ("x.pdf", b"not a pdf")})
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
