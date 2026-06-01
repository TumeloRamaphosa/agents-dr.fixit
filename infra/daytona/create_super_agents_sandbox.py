#!/usr/bin/env python3
"""
Create the single Daytona sandbox: Super Agents.

This is the only Studex build sandbox. Fly app super-agents is the paired VM/API hub.
"""

from __future__ import annotations

import argparse
import os
import sys

PUBLIC_URL = os.environ.get("SUPER_AGENTS_PUBLIC_URL", "https://super-agents.fly.dev").rstrip("/")


def main() -> int:
    parser = argparse.ArgumentParser(description="Create Super Agents sandbox on Daytona.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not os.environ.get("DAYTONA_API_KEY") and not args.dry_run:
        print("error: DAYTONA_API_KEY is not set.", file=sys.stderr)
        return 1

    try:
        from daytona import CreateSandboxFromSnapshotParams, Daytona
    except ImportError:
        print("error: pip install -r infra/daytona/requirements.txt", file=sys.stderr)
        return 1

    labels = {
        "wave": "aesthetics-agent-wave",
        "product": "super-agents",
        "role": "command-plane-and-build",
        "fly_app": "super-agents",
    }
    params = CreateSandboxFromSnapshotParams(
        name="Super Agents",
        language="python",
        labels=labels,
        env_vars={
            "STUDEX_WAVE": "aesthetics-agent-wave",
            "SUPER_AGENTS_HUB": PUBLIC_URL,
            "OPENAI_API_BASE": f"{PUBLIC_URL}/v1",
            "STUDEX_COMMAND_API": PUBLIC_URL,
        },
        auto_stop_interval=0,
    )

    if args.dry_run:
        print("dry-run:", params.name, labels)
        return 0

    sandbox = Daytona().create(params)
    print("Created Super Agents sandbox:")
    print(f"  id:    {sandbox.id}")
    print(f"  name:  {sandbox.name}")
    print(f"  state: {sandbox.state}")
    print(f"  hub:   {PUBLIC_URL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
