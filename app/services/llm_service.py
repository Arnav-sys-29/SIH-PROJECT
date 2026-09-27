"""LLM Service orchestrating OpenRouter API communication, live government search, and SSE streaming."""

import re
import time
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import Settings, get_settings
from app.prompts import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, StreamEvent
from app.tools.gov_search import search_gov_portals
from app.services.analytics_service import get_analytics_service

logger = logging.getLogger(__name__)


class StreamSanitizer:
    def __init__(self):
        self.total_output = ""
        self.yielded_length = 0

    def sanitize_streaming_text(self, raw_text: str) -> str:
        drop_tags = r"(?:tool_call|thought|think|function|parameter)"
        
        # 1. Strip complete drop blocks
        cleaned = re.sub(rf'<{drop_tags}[^>]*>[\s\S]*?</{drop_tags}>', '', raw_text, flags=re.IGNORECASE)
        
        # 2. Check for an unclosed start tag of a drop block
        match = re.search(rf'<{drop_tags}[^>]*>', cleaned, flags=re.IGNORECASE)
        if match:
            cleaned = cleaned[:match.start()]
            
        # 3. Strip stray complete closing tags
        cleaned = re.sub(rf'</{drop_tags}[^>]*>', '', cleaned, flags=re.IGNORECASE)
        
        # 4. Strip search_gov_portals (and its partials)
        last_lt = cleaned.rfind('<')
        last_gt = cleaned.rfind('>')
        if last_lt != -1 and last_lt > last_gt:
            cleaned = cleaned[:last_lt]
            
        last_s = cleaned.rfind('s') 
        if last_s != -1:
            tail = cleaned[last_s:]
            if "search_gov_portals(".startswith(tail):
                cleaned = cleaned[:last_s]
                
        cleaned = re.sub(r'search_gov_portals\([^\)]*\)', '', cleaned, flags=re.IGNORECASE)
        
        match_func = re.search(r'search_gov_portals\(', cleaned, flags=re.IGNORECASE)
        if match_func:
            cleaned = cleaned[:match_func.start()]
            
        return cleaned

    def process_chunk(self, chunk: str) -> str:
        self.total_output += chunk
        clean_total = self.sanitize_streaming_text(self.total_output)
        
        if len(clean_total) > self.yielded_length:
            new_text = clean_total[self.yielded_length:]
            self.yielded_length = len(clean_total)
            return new_text
        return ""

class LLMService:
    """Manages chat completions with live government portal search and SSE streaming via OpenRouter."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

        self.client = AsyncOpenAI(
            base_url=self.settings.OPENROUTER_BASE_URL,
            api_key=self.settings.OPENROUTER_API_KEY or "dummy_key",
            default_headers={
                "HTTP-Referer": "https://github.com/rural-farmer-ai-chatbot",
                "X-Title": self.settings.APP_NAME,
            },
        )
        self.model_name = self.settings.OPENROUTER_MODEL_NAME or "openrouter/free"

    def _build_messages(self, request: ChatRequest, gov_context: str = "") -> List[Dict[str, Any]]:
        """Construct the prompt messages array including system instructions, history, and user input."""
        system_instruction = SYSTEM_PROMPT
        system_instruction += (
            "\n\n### LANGUAGE INSTRUCTION\n"
            "Detect the language of the user's latest message and reply in that exact same language or script. "
            "If they write Hinglish (Hindi in English letters), reply in Hinglish. "
            "If they write Hindi, reply in Hindi. If English, reply in English. "
            "Match the user's language -- do not switch them to another language. "
            "CRITICAL: Never output raw function calls, pseudo-code, or <tool_call> tags. Speak directly to the farmer."
        )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_instruction}
        ]

        # Add prior conversation history
        for msg in request.history:
            msg_dict: Dict[str, Any] = {"role": msg.role, "content": msg.content or ""}
            messages.append(msg_dict)

        # Append current user prompt with live government search data if available
        user_content = request.message
        if gov_context:
            user_content = (
                f"{request.message}\n\n"
                f"### VERIFIED OFFICIAL GOVERNMENT PORTAL DATA (.gov.in / .nic.in):\n"
                f"{gov_context}\n\n"
                f"Please synthesize this authentic data and provide a clear, practical answer for the farmer. "
                f"Reply in the same language the user wrote their question in."
            )

        messages.append({"role": "user", "content": user_content})
        return messages

    @staticmethod
    def _format_sse(event_data: StreamEvent) -> str:
        """Format a StreamEvent object into an SSE frame: data: {...}\n\n"""
        return f"data: {event_data.model_dump_json()}\n\n"

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """Execute live government portal search, feed authentic context to LLM, and stream SSE tokens."""
        user_query = request.message.strip()
        start_time = time.time()
        accumulated_answer = []
        unique_sources = []

        try:
            logger.info("Processing chat query: '%s' | Model: %s", user_query, self.model_name)

            # Step 1: Notify frontend that official portal search is initiated
            yield self._format_sse(
                StreamEvent(
                    type="tool_call_start",
                    content=f"Searching official government portals (.gov.in / .nic.in) for: '{user_query}'...",
                    metadata={"query": user_query, "tool": "search_gov_portals"},
                )
            )

            # Step 2: Execute live search on official government portals (.gov.in and .nic.in)
            search_result = await search_gov_portals(query=user_query, max_results=4)
            unique_sources = search_result.get("results", [])
            gov_context = search_result.get("formatted_context", "")

            # Step 3: Emit search results and verified source citations to frontend
            yield self._format_sse(
                StreamEvent(
                    type="tool_call_result",
                    content=f"Retrieved {len(unique_sources)} verified government source(s).",
                    metadata={"results": unique_sources},
                )
            )

            # Step 4: Construct augmented prompt messages with verified government portal facts
            messages = self._build_messages(request, gov_context=gov_context)

            # Step 5: Stream the final grounded answer from OpenRouter LLM
            logger.info("Streaming response from OpenRouter model: %s", self.model_name)
            stream_resp = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                stream=True,
            )

            sanitizer = StreamSanitizer()
            async for chunk in stream_resp:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    clean_chunk = sanitizer.process_chunk(delta.content)
                    if clean_chunk:
                        accumulated_answer.append(clean_chunk)
                        yield self._format_sse(StreamEvent(type="token", content=clean_chunk))

            # Record telemetry
            elapsed_ms = int((time.time() - start_time) * 1000)
            full_response = "".join(accumulated_answer)
            get_analytics_service().log_query(
                query=user_query,
                sources=unique_sources,
                response_snippet=full_response,
                latency_ms=elapsed_ms,
                status="Answered (Verified)",
            )

            # Signal completion
            yield self._format_sse(StreamEvent(type="done", content="Stream complete."))
            yield "data: [DONE]\n\n"

        except Exception as exc:
            logger.error("Error during LLM chat completion: %s", str(exc), exc_info=True)
            elapsed_ms = int((time.time() - start_time) * 1000)
            get_analytics_service().log_query(
                query=user_query,
                sources=unique_sources,
                response_snippet=f"Error: {str(exc)}",
                latency_ms=elapsed_ms,
                status="Error / Fallback",
            )
            yield self._format_sse(
                StreamEvent(
                    type="error",
                    content=f"An error occurred while communicating with the AI service: {str(exc)}",
                )
            )
            yield "data: [DONE]\n\n"


_llm_service_instance: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance


