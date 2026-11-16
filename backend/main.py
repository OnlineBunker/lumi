from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, chat

app = FastAPI(title="PDF Chat API")

# Production plus Vercel preview deployments (lumi-git-*.vercel.app etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://lumi[a-z0-9-]*\.vercel\.app|http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "ok"}
