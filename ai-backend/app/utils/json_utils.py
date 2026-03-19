"""
Shared JSON utility — parse LLM responses that may be wrapped in markdown code blocks.
Used by all agents to avoid the copy-paste of _safe_json in every file.
"""

import json


def safe_json(text: str) -> dict:
    """Parse JSON from an LLM response, handling markdown code-block wrappers.

    Handles these cases:
    - Plain JSON string
    - ```json\\n{...}\\n```
    - ```\\n{...}\\n```  (no language tag)
    - Trailing whitespace / newlines after closing backticks

    Returns a dict.  On parse failure returns {"raw_response": <original_text>}.
    """
    text = text.strip()

    # Strip opening ``` or ```json fence
    if text.startswith("```"):
        # Remove the first line (the fence with optional language tag)
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1:]
        else:
            text = text[3:]  # degenerate: ``` with no newline

    # Strip trailing ``` fence (after stripping whitespace)
    text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw_response": text}
