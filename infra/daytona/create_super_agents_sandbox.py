#!/usr/bin/env python3
"""Create Daytona sandbox named 'Super Agents' for cloud agent workloads."""

from __future__ import annotations

import argparse
import os
import sys


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
        "role": "hermes-cloud",
    }
    params = CreateSandboxFromSnapshotParams(
        name="Super Agents",
        language="python",
        labels=labels,
        env_vars={
            "STUDEX_AGENT": "hermes",
            "OPENAI_API_BASE": os.environ.get(
                "SUPER_AGENTS_API_BASE", "https://super-agents.fly.dev/v1"
            ),
        },
        auto_stop_interval=0,
    )

    if args.dry_run:
        print(f"dry-run: name={params.name!r} labels={labels}")
        return 0

    sandbox = Daytona().create(params)
    print("Created sandbox:", sandbox.id, sandbox.name, sandbox.state)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
