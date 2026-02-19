#!/usr/bin/env python3
"""
Analyze Instincts - Manual trigger for instinct analysis

Loads observations.jsonl, analyzes patterns using AI models,
and generates or updates instinct files with confidence scores.
"""

import argparse
import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import Optional

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

HOMUNCULUS_DIR = Path.home() / ".codebuddy" / "homunculus"
OBSERVATIONS_FILE = HOMUNCULUS_DIR / "observations.jsonl"
CONFIG_FILE = HOMUNCULUS_DIR / "config.json"
INSTINCTS_DIR = HOMUNCULUS_DIR / "instincts"
PERSONAL_DIR = INSTINCTS_DIR / "personal"


def load_config() -> dict:
    """Load configuration from config.json."""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "observer": {
            "model": "glm-5.0",
            "model_fallback": ["deepseek-v3.2", "kimi-k2.5"],
            "manual_trigger": True
        }
    }


def load_observations() -> list[dict]:
    """Load all observations from observations.jsonl."""
    if not OBSERVATIONS_FILE.exists():
        print(f"Error: Observations file not found: {OBSERVATIONS_FILE}")
        sys.exit(1)

    observations = []
    with open(OBSERVATIONS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    observations.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"Warning: Failed to parse line: {e}", file=sys.stderr)

    return observations


def analyze_patterns(observations: list[dict], model: str) -> list[dict]:
    """
    Analyze observations to identify patterns and suggest instincts.
    
    Returns list of suggested instincts with confidence scores.
    """
    print(f"\n{'='*60}")
    print(f"  ANALYZING {len(observations)} OBSERVATIONS")
    print(f"  Model: {model}")
    print(f"{'='*60}\n")

    # Group observations by type
    by_type = {}
    for obs in observations:
        obs_type = obs.get('type', 'unknown')
        if obs_type not in by_type:
            by_type[obs_type] = []
        by_type[obs_type].append(obs)

    print(f"Observation breakdown:")
    for obs_type, items in sorted(by_type.items()):
        print(f"  {obs_type}: {len(items)}")
    print()

    # Simple pattern detection (heuristic-based for demo)
    # In production, this would use AI models
    patterns = []

    # Detect frequently used tools
    tool_usage = {}
    for obs in observations:
        if obs.get('type') == 'tool_pre':
            tool_name = obs.get('tool_name', 'unknown')
            tool_usage[tool_name] = tool_usage.get(tool_name, 0) + 1

    for tool, count in sorted(tool_usage.items(), key=lambda x: -x[1]):
        if count >= 3:
            confidence = min(0.3 + (count / 30), 0.9)
            patterns.append({
                'id': f'use-{tool.lower().replace("_", "-")}',
                'trigger': f'when using {tool}',
                'confidence': confidence,
                'domain': 'workflow',
                'source': 'session-observation',
                'content': f"""# Use {tool}

## When to Apply

Trigger: when using {tool}

## Action

Prefer using {tool} for this operation based on observed usage patterns ({count} occurrences).

## Context

This instinct was learned from session observations showing frequent use of {tool}.
"""
            })

    # Detect session patterns
    sessions = [obs for obs in observations if obs.get('type') == 'session_start']
    if len(sessions) >= 2:
        patterns.append({
            'id': 'session-persistence',
            'trigger': 'when starting a new session',
            'confidence': 0.6,
            'domain': 'workflow',
            'source': 'session-observation',
            'content': """# Session Persistence

## When to Apply

Trigger: when starting a new session

## Action

Load previous session context and maintain state across sessions.

## Context

Consistent session patterns observed across multiple coding sessions.
"""
        })

    return patterns


def save_instincts(instincts: list[dict], personal_dir: Path, dry_run: bool = False) -> None:
    """Save suggested instincts to personal directory."""
    if not instincts:
        print("\nNo patterns detected to save.")
        return

    print(f"\n{'='*60}")
    print(f"  SUGGESTED INSTINCTS ({len(instincts)})")
    print(f"{'='*60}\n")

    for inst in instincts:
        conf = inst.get('confidence', 0.5)
        conf_bar = '#' * int(conf * 10) + '.' * (10 - int(conf * 10))
        print(f"{conf_bar} {int(conf*100):3d}%  {inst.get('id')}")
        print(f"            trigger: {inst.get('trigger')}")
        print()

    if dry_run:
        print("\n[DRY RUN] No files saved.")
        return

    # Ensure directory exists
    personal_dir.mkdir(parents=True, exist_ok=True)

    # Save each instinct
    saved = []
    for inst in instincts:
        filename = personal_dir / f"{inst['id']}.yaml"
        content = "---\n"
        content += f"id: {inst['id']}\n"
        content += f"trigger: \"{inst.get('trigger', 'unknown')}\"\n"
        content += f"confidence: {inst.get('confidence', 0.5)}\n"
        content += f"domain: {inst.get('domain', 'general')}\n"
        content += f"source: {inst.get('source', 'session-observation')}\n"
        content += f"generated_at: {datetime.now().isoformat()}\n"
        content += "---\n\n"
        content += inst.get('content', '') + "\n"

        filename.write_text(content, encoding='utf-8')
        saved.append(filename)

    print(f"\n[OK] Saved {len(saved)} instincts to {personal_dir}")
    for path in saved:
        print(f"   {path.name}")


def main():
    parser = argparse.ArgumentParser(description='Analyze observations and generate instincts')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--model', help='Override model choice')
    parser.add_argument('--min-confidence', type=float, default=0.3, help='Minimum confidence threshold')
    args = parser.parse_args()

    # Load configuration
    config = load_config()
    model = args.model or config.get('observer', {}).get('model', 'glm-5.0')

    # Load observations
    observations = load_observations()

    if not observations:
        print("No observations to analyze.")
        sys.exit(0)

    # Analyze patterns
    patterns = analyze_patterns(observations, model)

    # Filter by minimum confidence
    patterns = [p for p in patterns if p.get('confidence', 0) >= args.min_confidence]

    # Save instincts
    save_instincts(patterns, PERSONAL_DIR, args.dry_run)

    print(f"\n{'='*60}\n")


if __name__ == '__main__':
    sys.exit(main() or 0)
