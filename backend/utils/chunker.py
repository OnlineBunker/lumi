from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings

splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap,
    separators=["\n\n", "\n", ".", "!", "?", " "],
)


def chunk_pages(pages):
    return [
        {"text": text.strip(), "page": page["page"]}
        for page in pages
        for text in splitter.split_text(page["text"])
        if text.strip()
    ]
