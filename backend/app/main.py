import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1 import router as api_router

app = FastAPI(
    title="Красиво API",
    description="Beauty salon booking platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
upload_dir = settings.UPLOAD_DIR
os.makedirs(os.path.join(upload_dir, "avatars"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "portfolios"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "salons"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# API routes
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "krasivo-api"}
