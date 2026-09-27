"""FastAPI router handling the /chat SSE streaming endpoint and diagnostics."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatRequest
from app.services.llm_service import LLMService, get_llm_service
from app.tools.gov_search import search_gov_portals
from app.config import get_settings, Settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Chat & Rural Services"])


@router.post(
    "/chat",
    summary="Chat with Rural & Farmer AI Assistant (SSE Streaming)",
    description=(
        "Streams responses via Server-Sent Events (SSE). "
        "Strictly restricted to 5 domains (Cooperative laws, Ministry schemes, PMFBY, Financial literacy, "
        "Grievance redressal). Executes live search on official government portals (.gov.in/.nic.in) when needed."
    ),
    response_class=StreamingResponse,
)
async def chat_endpoint(
    request: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service),
):
    """Handle incoming user questions and stream the response via Server-Sent Events (SSE)."""
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'message' field cannot be empty or whitespace only.",
        )

    logger.info("Received /chat request with message: '%s'", request.message[:80])

    # Return StreamingResponse with SSE headers
    return StreamingResponse(
        llm_service.stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )


@router.get(
    "/search-test",
    summary="Test Government Portal Search",
    description="Utility endpoint to test and verify the government portal domain filtering search tool.",
)
async def search_test_endpoint(query: str, max_results: int = 4):
    """Directly test the DuckDuckGo gov.in / nic.in search tool."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    return await search_gov_portals(query=query, max_results=max_results)


@router.get(
    "/health",
    summary="Backend Health & Config Status",
    description="Check backend health, loaded configuration, and active OpenRouter model.",
)
async def health_endpoint(settings: Settings = Depends(get_settings)):
    """Health check endpoint."""
    has_api_key = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY != "your_openrouter_api_key_here")
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model_configured": settings.OPENROUTER_MODEL_NAME,
        "openrouter_base_url": settings.OPENROUTER_BASE_URL,
        "api_key_present": has_api_key,
        "domain_guardrails": [
            "1. Guidance on cooperative laws and by-laws",
            "2. Information on Ministry of Cooperation schemes and services",
            "3. PMFBY and agricultural support guidance",
            "4. Financial literacy assistance",
            "5. Cooperative grievance redressal support"
        ],
    }
