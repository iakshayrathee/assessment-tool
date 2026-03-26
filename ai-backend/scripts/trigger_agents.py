"""
AI Agent Trigger Script — CLI tool to trigger any AI agent and capture
raw DB data, prompts, and AI responses.

Usage:
    cd ai-backend
    python -m scripts.trigger_agents --agent assessment --student-id <id>
    python -m scripts.trigger_agents --agent educator --educator-id <id>
    python -m scripts.trigger_agents --agent report --student-id <id> --report-type ASSESSMENT
    python -m scripts.trigger_agents --agent risk --student-id <id>
    python -m scripts.trigger_agents --agent iep --student-id <id>
    python -m scripts.trigger_agents --agent lesson_plan --student-id <id> --week 1

Output is saved to scripts/output/<agent>_<timestamp>.json
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Ensure ai-backend root is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def trigger_via_http(args):
    """Call the transparency endpoint via HTTP."""
    import httpx

    base_url = os.environ.get("AI_BACKEND_URL", "http://localhost:8000")
    payload = {
        "agent": args.agent,
        "student_id": args.student_id or "",
        "educator_id": args.educator_id or "",
        "target_id": args.target_id or args.student_id or "",
        "report_type": args.report_type,
        "week_number": args.week,
        "scope": args.scope,
    }

    print(f"\n🔬 Triggering '{args.agent}' agent via {base_url}/api/transparency/trigger")
    print(f"   Payload: {json.dumps({k: v for k, v in payload.items() if v}, indent=2)}")
    print(f"   This may take 30–120 seconds...\n")

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(f"{base_url}/api/transparency/trigger", json=payload)
        if resp.status_code != 200:
            print(f"❌ Error {resp.status_code}: {resp.text}")
            return None
        return resp.json()


async def trigger_directly(args):
    """Import and call agents directly (when running in the same process)."""
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    from app.api.transparency import (
        _assessment_transparency,
        _iep_transparency,
        _lesson_plan_transparency,
        _report_transparency,
        _risk_transparency,
        _educator_transparency,
        _ser,
    )
    import time

    agent_name = args.agent.lower()
    print(f"\n🔬 Triggering '{agent_name}' agent directly...")
    print(f"   This may take 30–120 seconds...\n")

    start = time.time()

    if agent_name == "assessment":
        result = await _assessment_transparency(args.student_id)
    elif agent_name == "iep":
        result = await _iep_transparency(args.student_id)
    elif agent_name == "lesson_plan":
        result = await _lesson_plan_transparency(args.student_id, args.week)
    elif agent_name == "report":
        tid = args.target_id or args.student_id
        result = await _report_transparency(tid, args.report_type, args.educator_id or "")
    elif agent_name == "risk":
        tid = args.target_id or args.student_id
        result = await _risk_transparency(tid, args.scope)
    elif agent_name == "educator":
        result = await _educator_transparency(args.educator_id)
    else:
        print(f"❌ Unknown agent: {agent_name}")
        return None

    elapsed = round(time.time() - start, 2)
    result["agent"] = agent_name
    result["timestamp"] = datetime.now().isoformat()
    result["elapsed_seconds"] = elapsed
    return result


def save_output(data: dict, agent_name: str):
    """Save output JSON to scripts/output/."""
    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = output_dir / f"{agent_name}_{ts}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str, ensure_ascii=False)

    print(f"✅ Output saved to: {filename}")
    print(f"   File size: {filename.stat().st_size / 1024:.1f} KB")
    return filename


def print_summary(data: dict):
    """Print a quick summary of the captured data."""
    print(f"\n{'='*60}")
    print(f"  Agent: {data.get('agent', 'unknown')}")
    print(f"  Time: {data.get('elapsed_seconds', 'N/A')}s")
    print(f"  Timestamp: {data.get('timestamp', 'N/A')}")
    print(f"{'='*60}")

    raw = data.get("raw_data", {})
    print(f"\n📦 Raw Data Fetched ({len(raw)} tables):")
    for key, val in raw.items():
        if isinstance(val, list):
            print(f"   • {key}: {len(val)} records")
        elif isinstance(val, dict):
            print(f"   • {key}: {len(val)} fields")
        elif val is None:
            print(f"   • {key}: null")
        else:
            print(f"   • {key}: {type(val).__name__}")

    prompts = data.get("prompts_used", [])
    print(f"\n📝 Prompts Used ({len(prompts)}):")
    for p in prompts:
        name = p.get("name", "Unnamed")
        length = len(p.get("prompt", ""))
        print(f"   • {name} ({length} chars)")

    response = data.get("ai_response", {})
    print(f"\n🤖 AI Response Keys: {list(response.keys()) if isinstance(response, dict) else type(response).__name__}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Trigger AI agents and capture transparency data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m scripts.trigger_agents --agent assessment --student-id abc123
  python -m scripts.trigger_agents --agent educator --educator-id edu456
  python -m scripts.trigger_agents --agent report --student-id abc123 --report-type PARENT
  python -m scripts.trigger_agents --agent risk --student-id abc123
        """,
    )
    parser.add_argument("--agent", required=True, choices=["assessment", "iep", "lesson_plan", "report", "risk", "educator"],
                        help="Which AI agent to trigger")
    parser.add_argument("--student-id", default="", help="Student ID (required for most agents)")
    parser.add_argument("--educator-id", default="", help="Educator profile ID (required for educator agent)")
    parser.add_argument("--target-id", default="", help="Target ID (for report/risk agents — defaults to student-id)")
    parser.add_argument("--report-type", default="ASSESSMENT", choices=["ASSESSMENT", "LESSON_PLAN", "PARENT", "SCHOOL"],
                        help="Report type (for report agent)")
    parser.add_argument("--week", type=int, default=1, help="Week number (for lesson plan agent)")
    parser.add_argument("--scope", default="STUDENT", choices=["STUDENT", "SCHOOL"],
                        help="Scope (for risk agent)")
    parser.add_argument("--mode", default="http", choices=["http", "direct"],
                        help="'http' = call running server, 'direct' = import and run agents directly")

    args = parser.parse_args()

    # Validate required IDs
    if args.agent == "educator" and not args.educator_id:
        parser.error("--educator-id is required for the educator agent")
    if args.agent != "educator" and not args.student_id and not args.target_id:
        parser.error("--student-id is required for this agent")

    if args.mode == "http":
        result = asyncio.run(trigger_via_http(args))
    else:
        result = asyncio.run(trigger_directly(args))

    if result:
        print_summary(result)
        save_output(result, args.agent)


if __name__ == "__main__":
    main()
