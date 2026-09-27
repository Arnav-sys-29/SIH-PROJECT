"""Pydantic schemas for chat requests, responses, and SSE streaming events."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role: Literal["system", "user", "assistant", "tool"] = Field(
        ...,
        description="The role of the message author."
    )
    content: Optional[str] = Field(
        None,
        description="The text content of the message."
    )
    name: Optional[str] = Field(
        None,
        description="Name of the function/tool if role is 'tool'."
    )
    tool_call_id: Optional[str] = Field(
        None,
        description="Tool call ID if role is 'tool'."
    )


class ChatRequest(BaseModel):
    """Payload for the /chat endpoint."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's query or prompt.",
        examples=["What are the latest subsidy schemes under the Ministry of Cooperation for PACS?"]
    )
    history: Optional[List[ChatMessage]] = Field(
        default=[],
        description="Prior conversation history between user and assistant."
    )
    language: Optional[str] = Field(
        default="English",
        description="Preferred language for response (e.g., Hindi, Marathi, Telugu, English)."
    )


class StreamEvent(BaseModel):
    """Structured SSE event sent to the frontend."""
    type: Literal["token", "tool_call_start", "tool_call_result", "error", "done"] = Field(
        ...,
        description="Type of stream event."
    )
    content: Optional[str] = Field(
        None,
        description="Text content for token chunks, tool descriptions, or error messages."
    )
    metadata: Optional[dict] = Field(
        default=None,
        description="Optional metadata such as search queries, URLs cited, or status."
    )
