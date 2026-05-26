#!/usr/bin/env python3
"""
Create Daytona sandbox 'Cursor Studex' for aesthetics / Studex agent wave builds.

Requires DAYTONA_API_KEY (see README.md).

Usage:
  python3 create_cursor_studex_sandbox.py [--dry-run]
"""

from __future__ import annotations

import argparse
import os
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Create Cursor Studex sandbox on Daytona.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print params only; do not call Daytona API.",
    )
    args = parser.parse_args()

    if not os.environ.get("DAYTONA_API_KEY") and not args.dry_run:
        print("error: DAYTONA_API_KEY is not set.", file=sys.stderr)
        print("Export your Daytona API key, then rerun.", file=sys.stderr)
        return 1

    try:
        from daytona import CreateSandboxFromSnapshotParams, Daytona
    except ImportError:
        print("error: Install dependencies: pip install -r infra/daytona/requirements.txt", file=sys.stderr)
        return 1

    labels = {
        "wave": "aesthetics-agent-wave",
        "product": "studex-command-plane",
        "role": "cursor-cloud-agents",
    }

    params = CreateSandboxFromSnapshotParams(
        name="Cursor Studex",
        language="python",
        labels=labels,
        env_vars={
            "STUDEX_WAVE": "aesthetics-agent-wave",
        },
        auto_stop_interval=0,
    )

    if args.dry_run:
        print("dry-run: would create sandbox with:")
        print(f"  name={params.name!r} language={params.language!r}")
        print(f"  labels={labels}")
        return 0

    daytona = Daytona()
    sandbox = daytona.create(params)
    print("Created Daytona sandbox:")
    print(f"  id:    {sandbox.id}")
    print(f"  name:  {sandbox.name}")
    print(f"  state: {sandbox.state}")
    print(f"  labels: {sandbox.labels}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
