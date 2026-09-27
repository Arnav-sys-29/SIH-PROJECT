# S.E.V.A AI (Smart E-platform for Village Assistance) - FastAPI Backend 🌾

A specialized, high-performance FastAPI backend for **S.E.V.A AI** engineered specifically for **rural stakeholders, farmers, and cooperative society members in India**.

Powered by OpenRouter LLM, live official government portal verification (`.gov.in` / `.nic.in`), and real-time Server-Sent Events (SSE) streaming.

---

## 🌟 Key Features

1. **OpenRouter Async Integration (`openai` SDK)**:
   - Configured with `AsyncOpenAI(base_url="https://openrouter.ai/api/v1")`.
   - Reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL_NAME` from `.env` (defaults to `openrouter/free`).
2. **Live Official Government Portal Fetching**:
   - Integrated tool calling (`search_gov_portals`) powered by `duckduckgo-search`.
   - **Strict Domain Enforcement**: Appends `site:gov.in OR site:nic.in` to all search queries so data is retrieved exclusively from authentic government sources.
3. **Strict 5-Topic Domain Guardrails**:
   - Strictly restricted to:
     1. Cooperative laws and by-laws (MSCS Act, state cooperative acts, PACS model by-laws)
     2. Ministry of Cooperation schemes & services (PACS computerization, NCEL, NCOL, BBSSL, storage plan)
     3. PMFBY (Pradhan Mantri Fasal Bima Yojana) and agricultural support guidance
     4. Financial literacy assistance (KCC, interest subvention, rural credit, DBT, digital payments)
     5. Cooperative grievance redressal support (CRCS portal, Ombudsman, 14447 helpline)
   - Courteously declines queries outside these topics.
4. **Server-Sent Events (SSE) Response Streaming**:
   - Real-time token streaming with structured event types (`tool_call_start`, `tool_call_result`, `token`, `done`, `error`).

---

## 📁 Project Structure

```
chatbot/
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── requirements.txt          # Python dependencies
├── main.py                   # FastAPI application initialization & CORS
├── app/
│   ├── __init__.py
│   ├── config.py             # Settings management with pydantic-settings
│   ├── prompts.py            # System prompt with domain guardrails & tone
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── chat.py           # Pydantic validation schemas & SSE events
│   ├── tools/
│   │   ├── __init__.py
│   │   └── gov_search.py     # Search tool with hardcoded .gov.in/.nic.in restriction
│   ├── services/
│   │   ├── __init__.py
│   │   └── llm_service.py    # OpenRouter client, tool invocation loop, SSE streamer
│   └── routers/
│       ├── __init__.py
│       └── chat.py           # /chat and /health endpoints
└── README.md                 # Documentation and API guide
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11 or higher
- An OpenRouter API Key ([Get one here](https://openrouter.ai/keys))

### 2. Environment Setup

```bash
# Clone or navigate to the project directory
cd c:\Users\ARNAV\chatbot

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure `.env`

Copy `.env.example` to `.env` and insert your OpenRouter API Key:

```ini
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL_NAME=openrouter/free
# You can also use other models like:
# OPENROUTER_MODEL_NAME=meta-llama/llama-3.3-70b-instruct:free
# OPENROUTER_MODEL_NAME=mistralai/mistral-small-24b-instruct-2501:free
```

### 4. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`.
- Interactive API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## 📡 API Usage & Streaming Example

### Endpoint: `POST /chat`

#### Request Body:
```json
{
  "message": "What is the premium rate for Kharif crops under PMFBY and how to claim insurance for localized crop damage?",
  "history": [],
  "language": "English"
}
```

#### Curl Command (Streaming with SSE):
```bash
curl -N -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the latest PACS computerization schemes under the Ministry of Cooperation?"}'
```

#### SSE Stream Format:
```
data: {"type": "tool_call_start", "content": "Searching official government portals for: 'PACS computerization Ministry of Cooperation'...", "metadata": {"query": "PACS computerization Ministry of Cooperation", "tool": "search_gov_portals"}}

data: {"type": "tool_call_result", "content": "Retrieved 3 official government result(s).", "metadata": {...}}

data: {"type": "token", "content": "Under the Ministry of Cooperation, the PACS Computerization project aims to..."}

data: {"type": "token", "content": " modernize 63,000 Primary Agricultural Credit Societies across India..."}

data: {"type": "done", "content": "Stream complete."}

data: [DONE]
```

---

## 🔍 How the Government Search Tool Integration Works

The search functionality is defined in `app/tools/gov_search.py` and connected to the LLM via OpenAI Function Calling in `app/services/llm_service.py`.

1. **Tool Definition Schema**:
   The LLM receives `GOV_SEARCH_TOOL_DEFINITION` during the initial API call.
2. **Domain Restriction**:
   When the LLM triggers `search_gov_portals`, the query is automatically augmented:
   ```python
   gov_restricted_query = f"{query.strip()} (site:gov.in OR site:nic.in)"
   ```
3. **Execution & Context Feeding**:
   The results from `duckduckgo_search` are formatted into structured context containing titles, summary snippets, and verified `.gov.in`/`.nic.in` URLs, and appended to the prompt as a `role: tool` message.
4. **Final Answer Generation**:
   The model synthesizes the authentic facts and streams the verified response to the client.
