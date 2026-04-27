# Lumi — AI-Powered PDF Chat
 
Lumi is a full-stack RAG (Retrieval-Augmented Generation) app that lets you upload a PDF and chat with it using Google Gemini. Ask questions about your document and get accurate, source-cited answers in real time.
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| LLM | Google Gemini 2.5 Flash |
| Embeddings | Google Gemini Embedding 001 |
| Vector Store | ChromaDB |
| PDF Parsing | PyMuPDF |
 
---
 
## Features
 
- Upload any PDF and process it instantly
- Ask questions in natural language
- Streaming responses token by token
- Source citations with page numbers
- Multiple chat modes
- Persistent vector storage
---
 
## Project Structure
 
```
pdf-chat-app/
├── backend/
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   ├── routers/
│   │   ├── chat.py             # Chat endpoint (SSE streaming)
│   │   └── upload.py           # PDF upload endpoint
│   ├── services/
│   │   ├── chat_service.py     # LLM streaming logic
│   │   ├── pdf_service.py      # PDF parsing and storage
│   │   └── rag_service.py      # ChromaDB store and retrieval
│   ├── utils/
│   │   ├── chunker.py          # Text splitting
│   │   ├── embedder.py         # Gemini embedding calls
│   │   └── prompt_builder.py   # System and user prompt construction
│   ├── config.py               # Settings via pydantic-settings
│   └── main.py                 # FastAPI app entry point
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # API calls to backend
│   │   ├── components/         # React UI components
│   │   ├── hooks/useChat.js    # Chat state and streaming hook
│   │   ├── pages/              # HomePage and WorkspacePage
│   │   └── store/chatStore.js  # Global state
│   └── vite.config.js
├── requirements.txt
└── README.md
```
 
---
 
## Local Development
 
### Prerequisites
 
- Python 3.11+
- Node.js 18+
- Google Gemini API key — get one free at [aistudio.google.com](https://aistudio.google.com)
### 1. Clone the repo
 
```bash
git clone https://github.com/OnlineBunker/lumi.git
cd lumi
```
 
### 2. Set up the backend
 
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```
 
Create a `.env` file inside `backend/`:
 
```dotenv
GEMINI_API_KEY=your-gemini-api-key-here
LLM_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
UPLOAD_DIR=./uploads
VECTOR_STORE_DIR=./vector_store
CHUNK_SIZE=500
CHUNK_OVERLAP=100
TOP_K_CHUNKS=5
```
 
Start the backend:
 
```bash
python -m uvicorn main:app --reload
```
 
Backend runs at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`
 
### 3. Set up the frontend
 
Open a new terminal:
 
```bash
cd frontend
npm install
npm run dev
```
 
Frontend runs at `http://localhost:5173`
 
---
 
## Deployment
 
### Frontend — Vercel
 
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Deploy — you get a live URL instantly
### Backend — Render
 
1. Go to [render.com](https://render.com) → New Web Service → Connect repo
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `pip install -r ../requirements.txt`
4. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the Environment tab:
   - `GEMINI_API_KEY`
   - `LLM_MODEL` = `gemini-2.5-flash`
   - `EMBEDDING_MODEL` = `gemini-embedding-001`
6. Deploy
> Note: Render's free tier spins down after 15 minutes of inactivity. First request after inactivity takes ~30 seconds to wake up.
 
---
 
## Environment Variables
 
| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | required |
| `LLM_MODEL` | Gemini model for chat | `gemini-2.5-flash` |
| `EMBEDDING_MODEL` | Gemini model for embeddings | `gemini-embedding-001` |
| `UPLOAD_DIR` | Directory to store uploaded PDFs | `./uploads` |
| `VECTOR_STORE_DIR` | Directory for ChromaDB | `./vector_store` |
| `CHUNK_SIZE` | Characters per text chunk | `500` |
| `CHUNK_OVERLAP` | Overlap between chunks | `100` |
| `TOP_K_CHUNKS` | Chunks retrieved per query | `5` |
 
---
 
## How It Works
 
1. **Upload** — PDF is parsed page by page using PyMuPDF
2. **Chunk** — Text is split into overlapping chunks using LangChain text splitter
3. **Embed** — Each chunk is embedded using Gemini Embedding and stored in ChromaDB
4. **Query** — User question is embedded and compared against stored chunks via cosine similarity
5. **Generate** — Top matching chunks are injected into a prompt and streamed through Gemini Flash
6. **Stream** — Tokens arrive in real time via Server-Sent Events (SSE)
---
 
## License
 
MIT