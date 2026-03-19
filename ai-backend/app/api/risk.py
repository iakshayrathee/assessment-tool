"""
Risk & Progress API routes — /api/risk
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.risk_agent import get_risk_agent
from app.utils.langsmith_config import risk_run_config

router = APIRouter(prefix="/api/risk", tags=["Risk & Progress"])


class RiskRequest(BaseModel):
    scope: str = "STUDENT"  # STUDENT | SCHOOL | CENTER
    target_id: str


class RiskResponse(BaseModel):
    scope: str
    target_id: str
    risk_classifications: list = []
    progress_trends: dict = {}
    early_warnings: list = []
    recommendations: list = []


@router.post("/analyze", response_model=RiskResponse)
async def analyze_risk(req: RiskRequest):
    """Analyze risk and progress for a student or school."""
    try:
        agent = get_risk_agent()
        config = risk_run_config(req.target_id, req.scope)

        result = await agent.ainvoke(
            {
                "scope": req.scope,
                "target_id": req.target_id,
            },
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return RiskResponse(
            scope=req.scope,
            target_id=req.target_id,
            risk_classifications=result.get("risk_classifications", []),
            progress_trends=result.get("progress_trends", {}),
            early_warnings=result.get("early_warnings", []),
            recommendations=result.get("recommendations", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
