# AI Backend — Assessment Tool

AI-powered agents for student assessment analysis, IEP goal planning, lesson plan generation, report creation, risk analysis, and educator performance insights.

## Architecture

- **Framework**: FastAPI (Python 3.12)
- **AI Orchestration**: LangGraph (multi-step agent workflows with state machines)
- **LLM**: LangChain + OpenAI (GPT-4o-mini for agents, GPT-4o for reports)
- **Observability**: LangSmith (tracing, monitoring, cost tracking)
- **Database**: PostgreSQL (read-only) via asyncpg + SQLAlchemy
- **State Persistence**: Redis (LangGraph checkpoints)

## Agents

| Agent | Endpoint | Nodes | Purpose |
|-------|----------|-------|---------|
| Assessment Intelligence | `POST /api/assessment/analyze` | 7 | Symptom analysis, severity scoring, risk classification, LD detection |
| IEP & Goal Planning | `POST /api/iep/generate` | 7 | SMART goals, LTP, STP, WLP generation |
| Lesson Plan | `POST /api/lesson-plan/suggest` | 3 | Weekly plan suggestions based on recent progress |
| Report Generation | `POST /api/report/generate` | 3 | Assessment, Lesson Plan, Parent, School, Center reports |
| Risk & Progress | `POST /api/risk/analyze` | 4 | Batch risk classification, trend analysis, early warnings |
| Educator Intelligence | `POST /api/educator/insights` | 3 | Teaching effectiveness, mentoring insights, training recs |

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env with your API keys and database URL

# 4. Run the server
uvicorn app.main:app --reload --port 8000

# 5. Open API docs
# http://localhost:8000/docs
```

## Cost Estimates (Optimized)

| Scale | First Run | With Caching |
|-------|-----------|-------------|
| 1 student | $0.011 | $0 (if unchanged) |
| 1,000/month | $11 | ~$2-5 |
| 10,000/month | $110 | ~$20-50 |

7 optimizations applied: GPT-4o-mini everywhere, batched calls, response caching, JSON mode, prompt compression, conditional execution, reduced max_tokens.

## Key Design: Editability

All AI-generated content (goals, plans, reports) is returned with `status: "AI_DRAFT"` and `editable: true`. Educators review, modify, and approve before finalizing.

## Integration with Node.js Backend

The Node.js backend calls this service via `aiBackendProxy.ts`. Set `AI_BACKEND_URL` in the Node.js `.env`:

```env
AI_BACKEND_URL=http://localhost:8000
```

## Testing

```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```
