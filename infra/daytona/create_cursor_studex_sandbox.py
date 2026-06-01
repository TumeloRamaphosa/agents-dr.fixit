#!/usr/bin/env python3
"""Deprecated: use create_super_agents_sandbox.py (single sandbox: Super Agents)."""

from __future__ import annotations

import sys


def main() -> int:
    print(
        "Cursor Studex is merged into the Super Agents sandbox.\n"
        "Run: python infra/daytona/create_super_agents_sandbox.py",
        file=sys.stderr,
    )
    if "--force-legacy" in sys.argv:
        import os
        from daytona import CreateSandboxFromSnapshotParams, Daytona

        if not os.environ.get("DAYTONA_API_KEY"):
            return 1
        params = CreateSandboxFromSnapshotParams(
            name="Super Agents",
            language="python",
            labels={"wave": "aesthetics-agent-wave", "product": "super-agents"},
            env_vars={"STUDEX_WAVE": "aesthetics-agent-wave"},
            auto_stop_interval=0,
        )
        s = Daytona().create(params)
        print(s.id, s.name)
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
