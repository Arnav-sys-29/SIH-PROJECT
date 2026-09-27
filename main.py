"""Main FastAPI application entrypoint for the Rural & Farmer AI Chatbot."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers.chat import router as chat_router
from app.routers.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown routines."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("🌾 Starting %s (v%s)", settings.APP_NAME, settings.APP_VERSION)
    logger.info("🤖 OpenRouter Model: %s", settings.OPENROUTER_MODEL_NAME)
    logger.info("🔗 OpenRouter Endpoint: %s", settings.OPENROUTER_BASE_URL)
    
    if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY == "your_openrouter_api_key_here":
        logger.warning("⚠️  OPENROUTER_API_KEY is not set or using placeholder in .env! Please configure a valid key.")
    else:
        logger.info("🔑 OpenRouter API Key configured successfully.")
        
    logger.info("🛡️ Domain Guardrails: Strictly enabled for 5 Rural/Farmer Topics.")
    logger.info("🔍 Live Web Search: Enabled (Restricted to .gov.in and .nic.in).")
    logger.info("=" * 60)

    yield

    logger.info("🌾 Shutting down %s", settings.APP_NAME)


# Create FastAPI application instance
settings = get_settings()
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Specialized AI Chatbot backend for rural stakeholders, farmers, and cooperative members in India. "
        "Powered by OpenRouter LLM, live official government portal verification (.gov.in / .nic.in), and SSE streaming."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integrations (React, Next.js, Vue, Mobile apps, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to your specific frontend domain(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Chat & Utilities Router
app.include_router(chat_router)
app.include_router(admin_router)


@app.get("/", summary="Root index", tags=["System"])
async def root():
    """Root landing endpoint with system overview."""
    return {
        "message": "Welcome to S.E.V.A AI Backend",
        "documentation": "/docs",
        "health_check": "/health",
        "chat_endpoint": "/chat",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to capture unhandled errors."""
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check server logs."},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
